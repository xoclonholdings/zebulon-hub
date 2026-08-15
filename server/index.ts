import { createHash, timingSafeEqual } from 'crypto';
import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import { PrivyClient } from '@privy-io/node';
import path from 'path';
import { fileURLToPath } from 'url';
import zcosCanonicalRoutes from './routes/zcos-canonical.js';
import zcosAdminRoutes from './routes/zcos-admin.js';
import zcosSsoRoutes from './routes/sso.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = Number(process.env.PORT || 5000);
const production = process.env.NODE_ENV === 'production';

const configuredOrigins = String(process.env.ALLOWED_FRONTEND_ORIGINS || process.env.FRONTEND_URL || '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);
const allowedOrigins = new Set(configuredOrigins);

if (production && !process.env.SESSION_SECRET) throw new Error('SESSION_SECRET is required in production');

app.set('trust proxy', 1);
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.has(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-zcos-galaxy');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.header('Vary', 'Origin');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(session({
  name: 'zcos.sid',
  secret: process.env.SESSION_SECRET || 'development-only-zcos-session',
  resave: false,
  saveUninitialized: false,
  proxy: production,
  cookie: {
    secure: production,
    httpOnly: true,
    sameSite: production ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000,
  },
}));

app.use(express.static(path.join(__dirname, '../dist/public')));

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    if (req.path.startsWith('/api')) console.log(`${req.method} ${req.path} ${res.statusCode} in ${Date.now() - start}ms`);
  });
  next();
});

type SessionUser = {
  id: string;
  username: string;
  email?: string;
  isAdmin?: boolean;
  authMethod: 'privy' | 'secure_phrase';
};

interface AuthenticatedRequest extends Request {
  session: session.Session & { userId?: string; user?: SessionUser };
}

const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.session.userId || !req.session.user) return res.status(401).json({ error: 'Authentication required' });
  next();
};

function saveSession(req: AuthenticatedRequest): Promise<void> {
  return new Promise((resolve, reject) => req.session.save((error) => error ? reject(error) : resolve()));
}

function regenerateSession(req: AuthenticatedRequest): Promise<void> {
  return new Promise((resolve, reject) => req.session.regenerate((error) => error ? reject(error) : resolve()));
}

function readBearerToken(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.match(/^Bearer\s+(.+)$/i)?.[1]?.trim() || '';
}

function usernameFromEmail(email: string): string {
  return email.split('@')[0]?.trim() || 'ZAR User';
}

function canonicalPrivyOwnerId(appId: string, subject: string): string {
  const digest = createHash('sha256').update(`privy\0${appId}\0${subject}`).digest('hex');
  return `user_privy_${digest.slice(0, 32)}`;
}

function secureEquals(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

app.post('/api/auth/privy/session', async (req: Request, res: Response) => {
  const appId = String(process.env.VITE_PRIVY_APP_ID || process.env.PRIVY_APP_ID || '').trim();
  const appSecret = String(process.env.PRIVY_APP_SECRET || '').trim();
  if (!appId || !appSecret) return res.status(503).json({ error: 'Privy sign-in is not configured' });

  const accessToken = readBearerToken(req.headers.authorization);
  if (!accessToken) return res.status(401).json({ error: 'Privy access token is required' });

  try {
    const client = new PrivyClient({ appId, appSecret });
    const claims = await client.utils().auth().verifyAccessToken(accessToken);
    const subject = claims.user_id;
    if (!subject) return res.status(401).json({ error: 'Privy access token is invalid' });

    const privyUser: any = await client.users()._get(subject);
    if (!privyUser?.id || privyUser.id !== subject) return res.status(401).json({ error: 'Privy Identity does not match the session' });

    const emailAccount = (privyUser.linked_accounts || []).find((account: any) =>
      account?.type === 'email' && typeof account.address === 'string' && Number(account.verified_at) > 0
    );
    const email = String(emailAccount?.address || '').trim().toLowerCase();
    if (!email) return res.status(401).json({ error: 'A verified email is required for ZCOS sign-in' });

    const authReq = req as AuthenticatedRequest;
    await regenerateSession(authReq);
    const user: SessionUser = {
      id: canonicalPrivyOwnerId(appId, subject),
      username: usernameFromEmail(email),
      email,
      isAdmin: false,
      authMethod: 'privy',
    };
    authReq.session.userId = user.id;
    authReq.session.user = user;
    await saveSession(authReq);
    res.json({ success: true });
  } catch (error) {
    console.error('Privy authentication failed:', error);
    res.status(401).json({ error: 'Privy sign-in could not be verified' });
  }
});

app.post('/api/login', async (req: Request, res: Response) => {
  const configuredPhrase = String(process.env.ZCOS_ADMIN_SECURE_PHRASE || '').trim();
  const suppliedPhrase = String(req.body?.passphrase || '').trim();
  if (!configuredPhrase) return res.status(503).json({ error: 'Admin secure phrase is not configured' });
  if (!suppliedPhrase || !secureEquals(configuredPhrase, suppliedPhrase)) return res.status(401).json({ error: 'Invalid secure phrase' });

  try {
    const authReq = req as AuthenticatedRequest;
    await regenerateSession(authReq);
    const user: SessionUser = {
      id: 'user_admin',
      username: 'Admin',
      isAdmin: true,
      authMethod: 'secure_phrase',
    };
    authReq.session.userId = user.id;
    authReq.session.user = user;
    await saveSession(authReq);
    res.json({ success: true, user });
  } catch (error) {
    console.error('Admin secure phrase login failed:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/me', (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  if (!authReq.session.userId || !authReq.session.user) return res.status(401).json({ error: 'Authentication required' });
  res.json({ user: authReq.session.user });
});

app.post('/api/logout', (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  authReq.session.destroy((error) => {
    if (error) return res.status(500).json({ error: 'Failed to logout' });
    res.clearCookie('zcos.sid');
    res.json({ success: true });
  });
});

app.get('/api/system/status', (_req, res) => {
  res.json({
    system: 'ZCOS',
    status: 'operational',
    identityAuthority: 'ZCOS Universal Auth',
    canonicalAuthorities: ['identity', 'memory', 'knowledge', 'apps', 'desk', 'settings', 'portal'],
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/sso', zcosSsoRoutes);
app.use('/api/zcos/admin', zcosAdminRoutes);
app.use('/api/zcos', zcosCanonicalRoutes);

app.get(['/health', '/api/health'], (_req, res) => {
  res.json({ ok: true, service: 'zcos', database: 'Canonical PostgreSQL', timestamp: new Date().toISOString() });
});

const publicPath = path.join(__dirname, '../dist/public');
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ error: 'API endpoint not found' });
  res.sendFile(path.join(publicPath, 'index.html'));
});

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = Number(err.status || err.statusCode || 500);
  const message = err.message || 'Internal Server Error';
  if (status >= 500) console.error(err);
  res.status(status).json({ error: message });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`ZCOS server listening on port ${PORT}`);
  console.log(`Allowed frontend origins: ${configuredOrigins.join(', ') || '(same-origin only)'}`);
});
