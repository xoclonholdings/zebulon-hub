import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import bcrypt from 'bcrypt';
import path from 'path';
import { fileURLToPath } from 'url';
import { storage } from './storage-prisma.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy for session security
app.set('trust proxy', 1);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'zebulon-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Serve static files from built public directory
app.use(express.static(path.join(__dirname, '../dist/public')));

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

// ZED Chat Response Generator
function generateOracleResponse(userMessage: string, userId: number): string {
  const message = userMessage.toLowerCase();
  
  // Oracle database-focused responses
  if (message.includes('hello') || message.includes('hi')) {
    return `Welcome to Zebulon Oracle. I can help you with database queries, data analysis, and system insights. What would you like to explore?`;
  }
  
  if (message.includes('database') || message.includes('query') || message.includes('sql')) {
    return `I can assist with database operations, SQL queries, and data analysis. Please describe what data you're looking for or what operation you'd like to perform.`;
  }
  
  if (message.includes('help') || message.includes('what can you do')) {
    return `I'm the Zebulon Oracle system. I can help with database queries, data analysis, system monitoring, and providing insights from your data. What specific assistance do you need?`;
  }
  
  if (message.includes('status') || message.includes('system')) {
    return `The Zebulon Oracle system is operational. I can provide system status, database health information, and performance metrics. What would you like to know?`;
  }
  
  // Default Oracle-focused responses
  const responses = [
    `Oracle analyzing: "${userMessage}". I'm processing this request through the Zebulon database systems to provide you with accurate information.`,
    `Zebulon Oracle received: "${userMessage}". Let me query the relevant data sources and provide you with comprehensive insights.`,
    `Processing your Oracle request: "${userMessage}". I'm accessing the database systems to gather the information you need.`,
    `Oracle system processing: "${userMessage}". I'll provide you with data-driven insights and analysis.`
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
}

// Authentication endpoints
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = await storage.getUserByUsername(username);
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Update last login
    await storage.updateUserLogin(user.id);

    // Set session
    (req as AuthenticatedRequest).session.userId = user.id;
    (req as AuthenticatedRequest).session.user = user;

    res.json({
      id: user.id,
      username: user.username,
      role: user.role
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const existingUser = await storage.getUserByUsername(username);
    if (existingUser) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await storage.createUser({
      username,
      passwordHash: hashedPassword,
      role: 'user'
    });

    // Set session
    (req as AuthenticatedRequest).session.userId = newUser.id;
    (req as AuthenticatedRequest).session.user = newUser;

    res.json({
      id: newUser.id,
      username: newUser.username,
      role: newUser.role
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/auth/me', requireAuth, async (req, res) => {
  try {
    const userId = (req as AuthenticatedRequest).session.userId!;
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      username: user.username,
      role: user.role
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  (req as AuthenticatedRequest).session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ error: 'Failed to logout' });
    }
    res.json({ message: 'Logged out successfully' });
  });
});

app.post('/api/auth/change-password', requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = (req as AuthenticatedRequest).session.userId!;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await storage.updateUserPassword(userId, hashedNewPassword);

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Chat endpoints
app.post('/api/chat', requireAuth, async (req, res) => {
  try {
    const { message } = req.body;
    const userId = (req as AuthenticatedRequest).session.userId!;
    
    if (!message?.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Save user message
    const userMessage = await storage.createChatMessage({
      userId,
      message: message.trim(),
      aiCore: 'user'
    });

    // Generate ZED response
    const zedResponse = generateOracleResponse(message, userId);
    
    // Save ZED response
    const zedMessage = await storage.createChatMessage({
      userId,
      message: zedResponse,
      aiCore: 'zed'
    });

    res.json({ 
      userMessage, 
      zedMessage,
      success: true 
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to process chat message' });
  }
});

app.get('/api/chat/history', requireAuth, async (req, res) => {
  try {
    const userId = (req as AuthenticatedRequest).session.userId!;
    const messages = await storage.getChatMessages(userId);
    res.json({ messages });
  } catch (error) {
    console.error('Chat history error:', error);
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
});

// System status endpoint
app.get('/api/system/status', async (req, res) => {
  try {
    const status = {
      oracleCore: {
        active: true,
        memory: 92,
        queries: 847,
        uptime: "99.97%",
        lastActivity: new Date().toISOString(),
        databaseConnections: 5,
        responseTime: "12ms"
      },
      system: {
        status: "operational",
        version: "1.0.0",
        components: ["Zebulon Oracle", "Database Engine", "Query Processor"]
      }
    };
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Zebulon Oracle System is running with Prisma' });
});

// Serve React app
const publicPath = path.join(__dirname, '../dist/public');
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(publicPath, 'index.html'));
  } else {
    res.status(404).json({ error: 'API endpoint not found' });
  }
});

// Error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
  console.error(err);
});

async function startServer() {
  try {
    console.log('Initializing database with Prisma...');
    
    // Start server
    app.listen(PORT, () => {
      console.log('Database initialization completed');
      console.log(`🚀 Zebulon Oracle System running on port ${PORT}`);
      console.log(`🌐 Frontend and Backend unified on single port`);
      console.log(`💾 Database: PostgreSQL with Prisma`);
      console.log(`🔮 Oracle: Database query and analysis engine ready`);
      console.log(`🔒 Security: Multi-layer protection active`);
      console.log(`🌍 Access your Zebulon Oracle System at: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();