import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import bcrypt from 'bcrypt';
import path from 'path';
import { fileURLToPath } from 'url';
import { storage } from './storage-prisma.js';
import gedcomRoutes from './routes/gedcom.js';
import knowledgeRoutes from './routes/knowledge.js';
import zcosCanonicalRoutes from './routes/zcos-canonical.js';
import zcosAdminRoutes from './routes/zcos-admin.js';
import { getActiveConnection } from './db-dual.js';

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

interface AuthenticatedRequest extends Request {
  session: session.Session & { userId?: number; user?: any };
}

const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Authentication required' });
  next();
};

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) return res.status(400).json({ error: 'Username and password are required' });
    const user = await storage.getUserByUsername(String(username));
    if (!user || !(await bcrypt.compare(String(password), user.passwordHash))) return res.status(401).json({ error: 'Invalid username or password' });
    await storage.updateUserLogin(user.id);
    (req as AuthenticatedRequest).session.userId = user.id;
    (req as AuthenticatedRequest).session.user = { id: user.id, username: user.username, role: user.role };
    res.json({ id: user.id, username: user.username, role: user.role });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) return res.status(400).json({ error: 'Username and password are required' });
    if (String(password).length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    if (await storage.getUserByUsername(String(username))) return res.status(409).json({ error: 'Username already exists' });
    const user = await storage.createUser({ username: String(username), passwordHash: await bcrypt.hash(String(password), 12), role: 'user' });
    (req as AuthenticatedRequest).session.userId = user.id;
    (req as AuthenticatedRequest).session.user = { id: user.id, username: user.username, role: user.role };
    res.status(201).json({ id: user.id, username: user.username, role: user.role });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/auth/me', requireAuth, async (req, res) => {
  try {
    const user = await storage.getUser((req as AuthenticatedRequest).session.userId!);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ id: user.id, username: user.username, role: user.role });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  (req as AuthenticatedRequest).session.destroy((error) => {
    if (error) return res.status(500).json({ error: 'Failed to logout' });
    res.clearCookie('zcos.sid');
    res.json({ success: true });
  });
});

app.post('/api/auth/change-password', requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    const user = await storage.getUser((req as AuthenticatedRequest).session.userId!);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!currentPassword || !newPassword || String(newPassword).length < 8) return res.status(400).json({ error: 'Valid current and new passwords are required' });
    if (!(await bcrypt.compare(String(currentPassword), user.passwordHash))) return res.status(401).json({ error: 'Current password is incorrect' });
    await storage.updateUserPassword(user.id, await bcrypt.hash(String(newPassword), 12));
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/system/status', (_req, res) => {
  res.json({
    system: 'ZCOS',
    status: 'migration',
    canonicalAuthorities: ['identity', 'memory', 'knowledge', 'apps', 'desk', 'settings', 'portal'],
    legacyAuthorities: { oracleMemory: 'read-only', knowledgePool: 'diagnostic-only' },
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/modules', requireAuth, async (_req, res) => {
  try { res.json(await storage.getModuleIntegrations()); }
  catch { res.status(500).json({ error: 'Failed to fetch modules' }); }
});
app.get('/api/modules/:moduleName', requireAuth, async (req, res) => {
  try {
    const module = await storage.getModuleIntegration(req.params.moduleName);
    if (!module) return res.status(404).json({ error: 'Module not found' });
    res.json(module);
  } catch { res.status(500).json({ error: 'Failed to fetch module' }); }
});
app.post('/api/modules', requireAuth, async (req, res) => {
  try { res.status(201).json(await storage.createModuleIntegration(req.body)); }
  catch { res.status(500).json({ error: 'Failed to create module integration' }); }
});
app.put('/api/modules/:moduleName', requireAuth, async (req, res) => {
  try { res.json(await storage.updateModuleIntegration(req.params.moduleName, req.body)); }
  catch { res.status(500).json({ error: 'Failed to update module integration' }); }
});
app.delete('/api/modules/:moduleName', requireAuth, async (req, res) => {
  try { await storage.deleteModuleIntegration(req.params.moduleName); res.json({ success: true }); }
  catch { res.status(500).json({ error: 'Failed to delete module integration' }); }
});

// OracleMemory is historical migration evidence. It cannot receive new canonical writes.
app.get('/api/oracle/memories', requireAuth, async (req, res) => {
  try {
    const { search, status, type } = req.query;
    res.json({ legacy: true, readOnly: true, memories: await storage.searchOracleMemories(search as string, status as string, type as string) });
  } catch { res.status(500).json({ error: 'Failed to fetch legacy memories' }); }
});
app.get('/api/oracle/recall/:label', requireAuth, async (req, res) => {
  try {
    const memory = await storage.getOracleMemoryByLabel(req.params.label);
    if (!memory) return res.status(404).json({ error: 'Memory not found' });
    res.json({ legacy: true, readOnly: true, memory });
  } catch { res.status(500).json({ error: 'Failed to fetch legacy memory' }); }
});
for (const method of ['post', 'patch', 'delete'] as const) {
  const route = method === 'post' ? '/api/oracle/store' : '/api/oracle/memories/:label';
  app[method](route, requireAuth, (_req, res) => res.status(410).json({ error: 'Legacy OracleMemory is read-only. Use /api/zcos/:galaxy/memory.' }));
}

// The old knowledge-pool service remains diagnostic migration evidence only and no longer owns /api/knowledge.
app.use('/api/legacy/knowledge-pool', requireAuth, knowledgeRoutes);
app.all('/api/knowledge', requireAuth, (_req, res) => res.status(410).json({ error: 'Legacy /api/knowledge is retired. Use /api/zcos/:galaxy/knowledge.' }));
app.all('/api/knowledge/*', requireAuth, (_req, res) => res.status(410).json({ error: 'Legacy /api/knowledge is retired. Use /api/zcos/:galaxy/knowledge.' }));

app.use('/api/gedcom', gedcomRoutes);
app.use('/api/zcos/admin', zcosAdminRoutes);
app.use('/api/zcos', zcosCanonicalRoutes);

app.get(['/health', '/api/health'], (_req, res) => {
  res.json({ ok: true, service: 'zcos', database: getActiveConnection(), timestamp: new Date().toISOString() });
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
