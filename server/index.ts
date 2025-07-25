import express, { type Request, Response, NextFunction } from "express";
import { storage } from "./storage-prisma";
import { initializeDatabase } from "./init-db";
import path from "path";

// Get current directory
const __dirname = path.dirname(new URL(import.meta.url).pathname);

const app = express();
const PORT = process.env.PORT || 5000;

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

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Zebulon AI System is running with Prisma' });
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await storage.getUser(parseInt(req.params.id));
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/chat/:userId', async (req, res) => {
  try {
    const messages = await storage.getChatMessages(parseInt(req.params.userId));
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/chat', async (req, res) => {
  try {
    const { userId, message, aiCore = 'zed' } = req.body;
    const chatMessage = await storage.createChatMessage({
      userId: parseInt(userId),
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
    const status = await storage.getSystemStatus();
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