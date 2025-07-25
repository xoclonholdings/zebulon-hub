import express, { type Request, Response, NextFunction } from "express";
import session from 'express-session';
import bcrypt from 'bcrypt';
import { storage } from "./storage-prisma";
import { initializeDatabase } from "./init-db";
import path from "path";

// Get current directory
const __dirname = path.dirname(new URL(import.meta.url).pathname);

const app = express();
const PORT = process.env.PORT || 5000;

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'zebulon-ai-system-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  }
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// CORS - Secure configuration
const allowedOrigins = [
  'http://localhost:5173',  // Vite dev server
  'http://127.0.0.1:5173',  // Alternative localhost
  'http://localhost:5000',  // Production same-port serving
  'http://127.0.0.1:5000',  // Alternative localhost production
  process.env.FRONTEND_URL  // Custom production frontend URL
].filter(Boolean);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (req.path.startsWith("/api")) {
      console.log(`${req.method} ${req.path} ${res.statusCode} in ${duration}ms`);
    }
  });
  next();
});

// Authentication middleware
interface AuthenticatedRequest extends Request {
  session: {
    userId?: number;
    user?: any;
  } & session.Session;
}

const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

// Authentication routes
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { username, password, email } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Check if user already exists
    const existingUser = await storage.getUserByUsername(username);
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await storage.createUser({
      username,
      passwordHash,
      email: email || null,
      codename: null,
      role: 'user',
      theme: 'dark',
      isAdmin: false
    });

    // Set session
    (req as AuthenticatedRequest).session.userId = user.id;
    (req as AuthenticatedRequest).session.user = {
      id: user.id,
      username: user.username,
      role: user.role
    };

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Find user
    const user = await storage.getUserByUsername(username);
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Check password
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Update last login
    await storage.updateUserLogin(user.id);

    // Set session
    (req as AuthenticatedRequest).session.userId = user.id;
    (req as AuthenticatedRequest).session.user = {
      id: user.id,
      username: user.username,
      role: user.role
    };

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/logout', (req: AuthenticatedRequest, res) => {
  req.session.destroy(() => {
    res.json({ message: 'Logged out successfully' });
  });
});

app.get('/api/auth/me', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const user = await storage.getUser(req.session.userId!);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Zebulon AI System is running with Prisma' });
});

app.get('/api/users/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = parseInt(req.params.id);
    // Users can only access their own data
    if (userId !== req.session.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/chat/:userId', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = parseInt(req.params.userId);
    // Users can only access their own messages
    if (userId !== req.session.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const messages = await storage.getChatMessages(userId);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/chat/:userId', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = parseInt(req.params.userId);
    // Users can only send messages for their own account
    if (userId !== req.session.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const { message, aiCore } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Create user message
    const userMessage = await storage.createChatMessage({
      userId,
      message,
      aiCore: aiCore || 'zed'
    });

    // For demo purposes, create a simple AI response
    const aiResponse = `Echo: ${message}`;
    
    const aiMessage = await storage.createChatMessage({
      userId,
      message: aiResponse,
      aiCore: aiCore || 'zed'
    });

    res.json({ userMessage, aiMessage });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/chat', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { message, aiCore = 'zed' } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    // Use the authenticated user's ID
    const chatMessage = await storage.createChatMessage({
      userId: req.session.userId!,
      message,
      aiCore
    });
    res.json(chatMessage);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/system/status', async (req, res) => {
  try {
    const status = {
      zedCore: {
        active: true,
        memory: 85,
        tasks: 12,
        uptime: "99.9%",
        lastActivity: new Date().toISOString()
      },
      system: {
        status: "operational",
        version: "1.0.0",
        components: ["Zebulon Core", "Zed AI Assistant"]
      }
    };
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});



// API health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Zebulon AI System is running with Prisma' });
});

// Development mode: redirect to Vite dev server
if (process.env.NODE_ENV === 'development') {
  app.get('/', (req, res) => {
    res.redirect('http://localhost:5173');
  });
  
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.redirect('http://localhost:5173' + req.path);
    } else {
      res.status(404).json({ error: 'API endpoint not found' });
    }
  });
}

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  const publicPath = path.join(__dirname, '../public');
  app.use(express.static(publicPath));
  
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(publicPath, 'index.html'));
    } else {
      res.status(404).json({ error: 'API endpoint not found' });
    }
  });
}

// Error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
  console.error(err);
});

async function startServer() {
  try {
    // Initialize database
    console.log('Initializing database...');
    await initializeDatabase();
    
    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`💾 Database: PostgreSQL with Prisma`);
      console.log(`🧠 AI: Local processing (no external APIs)`);
      console.log(`🔒 Security: Multi-layer protection active`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();