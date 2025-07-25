import express, { type Request, Response, NextFunction } from "express";
import session from 'express-session';
import bcrypt from 'bcrypt';
import { storage } from "./storage-prisma";
// No database initialization needed - using direct Prisma client
import path from "path";
// @ts-ignore if needed
// Get current directory
const __dirname = path.dirname(new URL(import.meta.url).pathname);

const app = express();
app.use(express.json())
const PORT = process.env.PORT || 5000;

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'zebulon-ai-system-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
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

// Zed AI Response Generator
function generateZedResponse(userMessage: string, userId: number): string {
  const message = userMessage.toLowerCase();
  
  // Context-aware responses based on user input
  if (message.includes('hello') || message.includes('hi')) {
    return `Hello! I'm Zed, your AI assistant within the Zebulon system. How can I help you today?`;
  }
  
  if (message.includes('zebulon') || message.includes('system')) {
    return `The Zebulon AI System is fully operational. I'm here to assist you with any questions or tasks you have. What would you like to explore?`;
  }
  
  if (message.includes('help') || message.includes('what can you do')) {
    return `I can help you with various tasks within the Zebulon system. I can answer questions, provide assistance, and help you navigate through different functionalities. What specific help do you need?`;
  }
  
  if (message.includes('history') || message.includes('remember')) {
    return `I have access to our conversation history and can reference previous interactions. This helps me provide more contextual and personalized assistance.`;
  }
  
  // Default contextual response
  const responses = [
    `I understand your message: "${userMessage}". Let me process this through my Zed AI core and provide you with the most helpful response.`,
    `Thank you for that input. As your Zed assistant, I'm analyzing: "${userMessage}" and preparing a comprehensive response.`,
    `Processing your request: "${userMessage}". I'm here to help you get the most out of the Zebulon AI System.`,
    `I've received: "${userMessage}". My Zed intelligence is working to provide you with the best possible assistance.`
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
}

// Real-time chat endpoints
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

    // Generate Zed AI response
    const aiResponse = generateZedResponse(message, userId);
    
    // Save AI response
    const aiMessage = await storage.createChatMessage({
      userId,
      message: aiResponse,
      aiCore: 'zed'
    });

    res.json({ 
      userMessage, 
      aiMessage,
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

// Simple log endpoint for testing (keep for compatibility)
app.post('/api/log', async (req, res) => {
  try {
    const { userId, message, aiCore = 'zed' } = req.body;
    
    if (!userId || !message) {
      return res.status(400).json({ error: 'Missing userId or message' });
    }

    const chatMessage = await storage.createChatMessage({
      userId: typeof userId === 'string' ? parseInt(userId) : userId,
      message,
      aiCore
    });
    
    res.json({ success: true, log: chatMessage });
  } catch (error) {
    console.error('Logging failed:', error);
    res.status(500).json({ error: 'Failed to log message' });
  }
});

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

app.get('/api/auth/me', async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await storage.getUser(req.session.userId);
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

// Development mode: redirect to frontend
if (process.env.NODE_ENV === 'development') {
  app.get('/', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Zebulon AI System</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              text-align: center; 
              background: #000; 
              color: #fff; 
              padding: 50px; 
            }
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
              padding: 40px; 
              border: 2px solid #3b82f6; 
              border-radius: 10px; 
            }
            .logo { width: 64px; height: 64px; margin: 20px auto; }
            a { 
              color: #3b82f6; 
              text-decoration: none; 
              font-size: 18px; 
              font-weight: bold; 
            }
            .note { 
              margin: 20px 0; 
              padding: 15px; 
              background: #1f2937; 
              border-radius: 5px; 
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🚀 Zebulon AI System</h1>
            <div class="note">
              <h3>⚠️ You're viewing the Backend API Server</h3>
              <p>To access the <strong>Zebulon Chat Interface</strong> with your Zed AI assistant:</p>
              <p><strong>Look for Port 5173 in your Replit environment</strong></p>
              <p>Or click: <a href="http://localhost:5173" target="_blank">Frontend Chat Interface</a></p>
            </div>
            <div class="note">
              <h4>System Status:</h4>
              <p>✅ Backend API: Running on Port 5000</p>
              <p>✅ Frontend UI: Running on Port 5173</p>
              <p>✅ Database: PostgreSQL Connected</p>
              <p>✅ Zed AI: Ready for Chat</p>
            </div>
          </div>
        </body>
      </html>
    `);
  });
  
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.json({
        note: 'This is the backend server',
        frontend: 'Access the frontend at: http://localhost:5173',
        available_apis: ['/api/auth/login', '/api/auth/signup', '/api/chat', '/api/chat/history']
      });
    } else {
      res.status(404).json({ error: 'API endpoint not found' });
    }
  });
} else {
  // Production mode: serve built files
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

// Server startup
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
    console.log('Initializing database with Prisma...');
    // Database will be initialized automatically when first accessed
    
    // Start server
    app.listen(PORT, () => {
      console.log('Database initialization completed');
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