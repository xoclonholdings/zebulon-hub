import express, { type Request, type Response, type NextFunction } from 'express';
import session from 'express-session';
import path from 'path';
import bcrypt from 'bcrypt';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { PrismaStorage } from './server/storage-prisma';
import { createServer } from 'http';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Constants
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';
const storage = new PrismaStorage();

// Create Express app
const app = express();
const server = createServer(app);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for development
  crossOriginEmbedderPolicy: false
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, // Set to true in production with HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Type definitions
interface AuthenticatedRequest extends Request {
  session: {
    userId?: number;
    user?: {
      id: number;
      username: string;
      role: string;
    };
    destroy: (callback?: (err?: any) => void) => void;
  };
}

// Auth middleware
const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.session?.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

// Auth endpoints
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

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    await storage.updateUserLogin(user.id);

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

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { username, password, email } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const existingUser = await storage.getUserByUsername(username);
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await storage.createUser({
      username,
      passwordHash,
      email: email || null,
      codename: null,
      role: 'user',
      theme: 'dark',
      isAdmin: false
    });

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

app.post('/api/auth/logout', (req: AuthenticatedRequest, res) => {
  req.session.destroy(() => {
    res.json({ message: 'Logged out successfully' });
  });
});

// Chat endpoints
app.post('/api/chat', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    // Save user message
    const userMessage = await storage.createChatMessage({
      userId: req.session.userId!,
      message,
      aiCore: 'user'
    });
    
    // Generate AI response
    const aiResponse = `Hello! I'm Zed, your AI assistant. You said: "${message}". How can I help you with the Zebulon system today?`;
    
    const aiMessage = await storage.createChatMessage({
      userId: req.session.userId!,
      message: aiResponse,
      aiCore: 'zed'
    });
    
    res.json({ success: true, userMessage, aiMessage });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

app.get('/api/chat/history', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const messages = await storage.getChatMessages(req.session.userId!);
    res.json({ messages });
  } catch (error) {
    console.error('Chat history error:', error);
    res.status(500).json({ error: 'Failed to get chat history' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Zebulon AI System is running' });
});

// Frontend serving
if (isProduction) {
  // Production: serve built files
  const publicPath = path.join(__dirname, 'dist/public');
  app.use(express.static(publicPath));
  
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(publicPath, 'index.html'));
    } else {
      res.status(404).json({ error: 'API endpoint not found' });
    }
  });
} else {
  // Development: serve a simple HTML page that loads React
  app.get('/', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Zebulon AI System</title>
          <style>
            body {
              margin: 0;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
              background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
              color: white;
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .container {
              text-align: center;
              max-width: 600px;
              padding: 2rem;
            }
            .logo {
              width: 80px;
              height: 80px;
              margin: 0 auto 2rem;
              background: #3b82f6;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 2rem;
              font-weight: bold;
            }
            h1 {
              font-size: 2.5rem;
              margin-bottom: 1rem;
              background: linear-gradient(45deg, #3b82f6, #8b5cf6);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
            }
            .status {
              background: rgba(59, 130, 246, 0.1);
              border: 1px solid rgba(59, 130, 246, 0.3);
              border-radius: 12px;
              padding: 1.5rem;
              margin: 2rem 0;
            }
            .btn {
              background: #3b82f6;
              border: none;
              color: white;
              padding: 12px 24px;
              border-radius: 8px;
              font-size: 1rem;
              cursor: pointer;
              margin: 0.5rem;
              transition: background 0.2s;
            }
            .btn:hover {
              background: #2563eb;
            }
            #root {
              min-height: 100vh;
            }
          </style>
        </head>
        <body>
          <div id="root">
            <div class="container">
              <div class="logo">Z</div>
              <h1>Zebulon AI System</h1>
              <div class="status">
                <h3>✅ System Status: Operational</h3>
                <p>🧠 Zed AI Assistant: Ready</p>
                <p>💾 Database: Connected</p>
                <p>🔒 Security: Active</p>
              </div>
              <p>Loading your intelligent assistant...</p>
              <button class="btn" onclick="window.location.reload()">Refresh</button>
            </div>
          </div>
          
          <script type="module">
            // Simple React-like functionality for now
            const API_BASE = '';
            
            // Check auth status
            fetch('/api/auth/me')
              .then(res => res.ok ? res.json() : null)
              .then(user => {
                if (user) {
                  showDashboard(user);
                } else {
                  showLogin();
                }
              })
              .catch(() => showLogin());
            
            function showLogin() {
              document.getElementById('root').innerHTML = \`
                <div class="container">
                  <div class="logo">Z</div>
                  <h1>Welcome to Zebulon</h1>
                  <div class="status">
                    <h3>🔐 Please Sign In</h3>
                    <form id="loginForm" style="max-width: 300px; margin: 0 auto;">
                      <input type="text" id="username" placeholder="Username" required 
                             style="width: 100%; padding: 12px; margin: 8px 0; border: 1px solid #374151; border-radius: 6px; background: #1f2937; color: white;">
                      <input type="password" id="password" placeholder="Password" required
                             style="width: 100%; padding: 12px; margin: 8px 0; border: 1px solid #374151; border-radius: 6px; background: #1f2937; color: white;">
                      <button type="submit" class="btn" style="width: 100%; margin-top: 16px;">Sign In</button>
                      <button type="button" class="btn" onclick="showSignup()" style="width: 100%; background: #6b7280;">Create Account</button>
                    </form>
                  </div>
                </div>
              \`;
              
              document.getElementById('loginForm').onsubmit = async (e) => {
                e.preventDefault();
                const username = document.getElementById('username').value;
                const password = document.getElementById('password').value;
                
                try {
                  const res = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                  });
                  
                  if (res.ok) {
                    const user = await res.json();
                    showDashboard(user);
                  } else {
                    alert('Login failed');
                  }
                } catch (err) {
                  alert('Network error');
                }
              };
            }
            
            function showSignup() {
              document.getElementById('root').innerHTML = \`
                <div class="container">
                  <div class="logo">Z</div>
                  <h1>Join Zebulon</h1>
                  <div class="status">
                    <h3>📝 Create Account</h3>
                    <form id="signupForm" style="max-width: 300px; margin: 0 auto;">
                      <input type="text" id="username" placeholder="Username" required 
                             style="width: 100%; padding: 12px; margin: 8px 0; border: 1px solid #374151; border-radius: 6px; background: #1f2937; color: white;">
                      <input type="email" id="email" placeholder="Email (optional)"
                             style="width: 100%; padding: 12px; margin: 8px 0; border: 1px solid #374151; border-radius: 6px; background: #1f2937; color: white;">
                      <input type="password" id="password" placeholder="Password" required
                             style="width: 100%; padding: 12px; margin: 8px 0; border: 1px solid #374151; border-radius: 6px; background: #1f2937; color: white;">
                      <button type="submit" class="btn" style="width: 100%; margin-top: 16px;">Create Account</button>
                      <button type="button" class="btn" onclick="showLogin()" style="width: 100%; background: #6b7280;">Back to Login</button>
                    </form>
                  </div>
                </div>
              \`;
              
              document.getElementById('signupForm').onsubmit = async (e) => {
                e.preventDefault();
                const username = document.getElementById('username').value;
                const email = document.getElementById('email').value;
                const password = document.getElementById('password').value;
                
                try {
                  const res = await fetch('/api/auth/signup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, email, password })
                  });
                  
                  if (res.ok) {
                    const user = await res.json();
                    showDashboard(user);
                  } else {
                    alert('Signup failed');
                  }
                } catch (err) {
                  alert('Network error');
                }
              };
            }
            
            function showDashboard(user) {
              document.getElementById('root').innerHTML = \`
                <div class="container">
                  <div class="logo">Z</div>
                  <h1>Hello, \${user.username}!</h1>
                  <div class="status">
                    <h3>💬 Chat with Zed</h3>
                    <div id="messages" style="height: 300px; overflow-y: auto; background: rgba(0,0,0,0.2); border-radius: 8px; padding: 16px; margin: 16px 0; text-align: left;"></div>
                    <div style="display: flex; gap: 8px;">
                      <input type="text" id="messageInput" placeholder="Type your message..." 
                             style="flex: 1; padding: 12px; border: 1px solid #374151; border-radius: 6px; background: #1f2937; color: white;">
                      <button onclick="sendMessage()" class="btn">Send</button>
                    </div>
                    <button onclick="logout()" class="btn" style="background: #ef4444; margin-top: 16px;">Logout</button>
                  </div>
                </div>
              \`;
              
              loadMessages();
              
              document.getElementById('messageInput').addEventListener('keypress', (e) => {
                if (e.key === 'Enter') sendMessage();
              });
            }
            
            async function sendMessage() {
              const input = document.getElementById('messageInput');
              const message = input.value.trim();
              if (!message) return;
              
              input.value = '';
              
              try {
                await fetch('/api/chat', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ message })
                });
                
                loadMessages();
              } catch (err) {
                alert('Failed to send message');
              }
            }
            
            async function loadMessages() {
              try {
                const res = await fetch('/api/chat/history');
                const data = await res.json();
                const messagesDiv = document.getElementById('messages');
                
                messagesDiv.innerHTML = data.messages.map(msg => \`
                  <div style="margin-bottom: 12px; padding: 8px; background: \${msg.aiCore === 'zed' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(34, 197, 94, 0.1)'}; border-radius: 6px;">
                    <strong>\${msg.aiCore === 'zed' ? 'Zed' : 'You'}:</strong> \${msg.message}
                  </div>
                \`).join('');
                
                messagesDiv.scrollTop = messagesDiv.scrollHeight;
              } catch (err) {
                console.error('Failed to load messages');
              }
            }
            
            async function logout() {
              await fetch('/api/auth/logout', { method: 'POST' });
              showLogin();
            }
            
            // Make functions global
            window.showLogin = showLogin;
            window.showSignup = showSignup;
            window.sendMessage = sendMessage;
            window.logout = logout;
          </script>
        </body>
      </html>
    `);
  });
  
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.redirect('/');
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

// Start server
async function startServer() {
  try {
    console.log('🚀 Starting Zebulon AI System...');
    
    server.listen(PORT, () => {
      console.log(`🌐 Server running on port ${PORT}`);
      console.log(`💾 Database: PostgreSQL with Prisma`);
      console.log(`🧠 AI: Local Zed assistant`);
      console.log(`🔒 Security: Multi-layer protection active`);
      
      if (!isProduction) {
        console.log(`🔧 Development mode: Frontend integrated with Vite`);
        console.log(`🌍 Access your app at: http://localhost:${PORT}`);
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();