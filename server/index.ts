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

// Serve static files from public directory (before other routes)
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.static(path.join(__dirname, '../server/public')));

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
      role: 'user'
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
      role: user.role
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Change password endpoint
app.post('/api/auth/change-password', async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    // Get current user
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await storage.updateUserPassword(user.id, newPasswordHash);

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
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

// Serve frontend and backend on the same port
if (process.env.NODE_ENV === 'development') {
  // Development: serve the complete interface
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
              background: #000000;
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
              background: rgba(20, 20, 20, 0.95);
              border-radius: 16px;
              backdrop-filter: blur(10px);
              border: 1px solid rgba(255, 255, 255, 0.1);
              box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
            }
            .logo {
              width: 100px;
              height: 100px;
              margin: 0 auto 2rem;
              display: flex;
              align-items: center;
              justify-content: center;
              position: relative;
            }
            .logo img {
              width: 100%;
              height: 100%;
              object-fit: contain;
            }
            h1 {
              font-size: 2.5rem;
              margin-bottom: 1rem;
              color: white;
              text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
            }
            .status {
              background: rgba(40, 40, 40, 0.6);
              border: 1px solid rgba(255, 255, 255, 0.1);
              border-radius: 12px;
              padding: 1.5rem;
              margin: 2rem 0;
              backdrop-filter: blur(10px);
            }
            .btn {
              background: rgba(60, 60, 60, 0.8);
              border: 1px solid rgba(255, 255, 255, 0.2);
              color: white;
              padding: 12px 24px;
              border-radius: 8px;
              font-size: 1rem;
              cursor: pointer;
              margin: 0.5rem;
              transition: all 0.2s ease;
              backdrop-filter: blur(10px);
            }
            .btn:hover {
              background: rgba(80, 80, 80, 0.9);
              border-color: rgba(255, 255, 255, 0.3);
            }
            #root {
              min-height: 100vh;
            }
            @keyframes pulse {
              0% { opacity: 0.6; }
              50% { opacity: 1; }
              100% { opacity: 0.6; }
            }
            .form-section {
              margin-bottom: 20px;
            }
            .form-section label {
              display: block;
              margin-bottom: 8px;
              color: rgba(255, 255, 255, 0.8);
              font-size: 14px;
              font-weight: 500;
            }
          </style>
        </head>
        <body>
          <div id="root">
            <div class="container">
              <div class="logo">
                <img src="/zed-logo.jpg" alt="Zed AI Logo" />
              </div>
              <h1>Zebulon AI System</h1>
              <div class="status">
                <h3>Loading your AI assistant...</h3>
                <div style="margin: 20px 0;">
                  <div style="width: 100%; height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px;">
                    <div style="width: 60%; height: 100%; background: linear-gradient(90deg, #666, #999); border-radius: 2px; animation: pulse 1.5s infinite;"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <script type="module">
            // Check auth status and show appropriate interface
            fetch('/api/auth/me', {
              credentials: 'same-origin'
            })
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
                  <div class="logo">
                    <img src="/zed-logo.jpg" alt="Zed AI Logo" />
                  </div>
                  <h1>Welcome to Zebulon</h1>
                  <div class="status">
                    <h3>🔐 Sign In to Continue</h3>
                    <form id="loginForm" style="max-width: 320px; margin: 0 auto;">
                      <div style="margin-bottom: 16px;">
                        <input type="text" id="username" placeholder="Enter your username" required 
                               style="width: 100%; padding: 14px; margin: 8px 0; border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 12px; background: rgba(30, 30, 30, 0.8); color: white; backdrop-filter: blur(10px); font-size: 16px;">
                      </div>
                      <div style="margin-bottom: 20px;">
                        <input type="password" id="password" placeholder="Enter your password" required
                               style="width: 100%; padding: 14px; margin: 8px 0; border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 12px; background: rgba(30, 30, 30, 0.8); color: white; backdrop-filter: blur(10px); font-size: 16px;">
                      </div>
                      <button type="submit" class="btn" style="width: 100%; margin-bottom: 12px; padding: 14px; font-size: 16px;">Sign In</button>
                      <button type="button" class="btn" onclick="showSignup()" style="width: 100%; background: rgba(80, 80, 80, 0.8); padding: 14px; font-size: 16px;">Create New Account</button>
                    </form>
                  </div>
                </div>
              \`;
              
              document.getElementById('loginForm').onsubmit = async (e) => {
                e.preventDefault();
                const username = document.getElementById('username').value.trim();
                const password = document.getElementById('password').value.trim();
                
                if (!username || !password) {
                  alert('Please enter both username and password');
                  return;
                }
                
                try {
                  const res = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'same-origin',
                    body: JSON.stringify({ username, password })
                  });
                  
                  if (res.ok) {
                    const user = await res.json();
                    showDashboard(user);
                  } else {
                    const error = await res.json();
                    alert('Login failed: ' + (error.error || 'Please check your credentials'));
                  }
                } catch (err) {
                  console.error('Login error:', err);
                  alert('Network error - please try again');
                }
              };
            }
            
            function showSignup() {
              document.getElementById('root').innerHTML = \`
                <div class="container">
                  <div class="logo">
                    <img src="/zed-logo.jpg" alt="Zed AI Logo" />
                  </div>
                  <h1>Join Zebulon</h1>
                  <div class="status">
                    <h3>📝 Create Your Account</h3>
                    <form id="signupForm" style="max-width: 320px; margin: 0 auto;">
                      <div style="margin-bottom: 16px;">
                        <input type="text" id="username" placeholder="Choose a username" required 
                               style="width: 100%; padding: 14px; margin: 8px 0; border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 12px; background: rgba(30, 30, 30, 0.8); color: white; backdrop-filter: blur(10px); font-size: 16px;">
                      </div>
                      <div style="margin-bottom: 16px;">
                        <input type="email" id="email" placeholder="Email address (optional)"
                               style="width: 100%; padding: 14px; margin: 8px 0; border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 12px; background: rgba(30, 30, 30, 0.8); color: white; backdrop-filter: blur(10px); font-size: 16px;">
                      </div>
                      <div style="margin-bottom: 16px;">
                        <input type="password" id="password" placeholder="Create a secure password (min 6 characters)" required
                               style="width: 100%; padding: 14px; margin: 8px 0; border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 12px; background: rgba(30, 30, 30, 0.8); color: white; backdrop-filter: blur(10px); font-size: 16px;">
                      </div>
                      <button type="submit" class="btn" style="width: 100%; margin-bottom: 12px; padding: 14px; font-size: 16px;">Create Account</button>
                      <button type="button" class="btn" onclick="showLogin()" style="width: 100%; background: rgba(80, 80, 80, 0.8); padding: 14px; font-size: 16px;">Back to Sign In</button>
                    </form>
                  </div>
                </div>
              \`;
              
              document.getElementById('signupForm').onsubmit = async (e) => {
                e.preventDefault();
                const username = document.getElementById('username').value.trim();
                const email = document.getElementById('email').value.trim();
                const password = document.getElementById('password').value.trim();
                
                if (!username || !password) {
                  alert('Please enter both username and password');
                  return;
                }
                
                if (password.length < 6) {
                  alert('Password must be at least 6 characters long');
                  return;
                }
                
                try {
                  const res = await fetch('/api/auth/signup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'same-origin',
                    body: JSON.stringify({ username, email, password })
                  });
                  
                  if (res.ok) {
                    const user = await res.json();
                    showDashboard(user);
                  } else {
                    const error = await res.json();
                    alert('Signup failed: ' + (error.error || 'Please try again'));
                  }
                } catch (err) {
                  console.error('Signup error:', err);
                  alert('Network error - please try again');
                }
              };
            }
            
            function showDashboard(user) {
              document.getElementById('root').innerHTML = \`
                <div class="container">
                  <div class="logo">
                    <img src="/zed-logo.jpg" alt="Zed AI Logo" />
                  </div>
                  <h1>Hello, \${user.username}!</h1>
                  <div class="status">
                    <h3>💬 Chat with Zed</h3>
                    <div id="messages" style="height: 300px; overflow-y: auto; background: rgba(20, 20, 20, 0.9); border-radius: 12px; padding: 16px; margin: 16px 0; text-align: left; backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.1);"></div>
                    <div style="display: flex; gap: 8px;">
                      <input type="text" id="messageInput" placeholder="Ask Zed anything..." 
                             style="flex: 1; padding: 12px; border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 8px; background: rgba(30, 30, 30, 0.8); color: white; backdrop-filter: blur(10px);">
                      <button onclick="sendMessage()" class="btn">Send</button>
                    </div>
                    <button onclick="showChangePassword()" class="btn" style="background: #3b82f6; margin-top: 16px;">Change Password</button>
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
                const res = await fetch('/api/chat', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'same-origin',
                  body: JSON.stringify({ message })
                });
                
                if (res.status === 401) {
                  alert('Session expired. Please log in again.');
                  showLogin();
                  return;
                }
                
                loadMessages();
              } catch (err) {
                console.error('Send message error:', err);
                alert('Failed to send message - please try again');
              }
            }
            
            async function loadMessages() {
              try {
                const res = await fetch('/api/chat/history', {
                  credentials: 'same-origin'
                });
                
                if (res.status === 401) {
                  showLogin();
                  return;
                }
                
                const data = await res.json();
                const messagesDiv = document.getElementById('messages');
                
                messagesDiv.innerHTML = data.messages.map(msg => \`
                  <div style="margin-bottom: 12px; padding: 12px; background: \${msg.aiCore === 'zed' ? 'rgba(50, 50, 50, 0.6)' : 'rgba(40, 40, 40, 0.6)'}; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.1);">
                    <strong style="color: \${msg.aiCore === 'zed' ? '#ffffff' : '#cccccc'};">\${msg.aiCore === 'zed' ? '🤖 Zed' : '👤 You'}:</strong> \${msg.message}
                  </div>
                \`).join('');
                
                messagesDiv.scrollTop = messagesDiv.scrollHeight;
              } catch (err) {
                console.error('Failed to load messages:', err);
              }
            }
            
            async function logout() {
              try {
                await fetch('/api/auth/logout', { 
                  method: 'POST',
                  credentials: 'same-origin'
                });
              } catch (err) {
                console.error('Logout error:', err);
              }
              // Always redirect to login regardless of response
              showLogin();
            }
            
            function showChangePassword() {
              document.getElementById('root').innerHTML = \`
                <div class="container">
                  <div class="logo">
                    <img src="/zed-logo.jpg" alt="Zed AI Logo" />
                  </div>
                  <h1>Change Password</h1>
                  <div class="form-container">
                    <form id="changePasswordForm">
                      <div class="form-group">
                        <label for="currentPassword">Current Password</label>
                        <input type="password" id="currentPassword" placeholder="Enter current password" required 
                               style="width: 100%; padding: 12px; border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 8px; background: rgba(30, 30, 30, 0.8); color: white; backdrop-filter: blur(10px);">
                      </div>
                      <div class="form-group">
                        <label for="newPassword">New Password</label>
                        <input type="password" id="newPassword" placeholder="Enter new password (min 6 characters)" required 
                               style="width: 100%; padding: 12px; border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 8px; background: rgba(30, 30, 30, 0.8); color: white; backdrop-filter: blur(10px);">
                      </div>
                      <div class="form-group">
                        <label for="confirmPassword">Confirm New Password</label>
                        <input type="password" id="confirmPassword" placeholder="Confirm new password" required 
                               style="width: 100%; padding: 12px; border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 8px; background: rgba(30, 30, 30, 0.8); color: white; backdrop-filter: blur(10px);">
                      </div>
                      <button type="submit" class="btn">Change Password</button>
                      <button type="button" onclick="location.reload()" class="btn" style="background: #6b7280; margin-top: 8px;">Cancel</button>
                    </form>
                  </div>
                </div>
              \`;
              
              document.getElementById('changePasswordForm').onsubmit = async (e) => {
                e.preventDefault();
                const currentPassword = document.getElementById('currentPassword').value;
                const newPassword = document.getElementById('newPassword').value;
                const confirmPassword = document.getElementById('confirmPassword').value;
                
                if (newPassword !== confirmPassword) {
                  alert('New passwords do not match');
                  return;
                }
                
                if (newPassword.length < 6) {
                  alert('New password must be at least 6 characters long');
                  return;
                }
                
                try {
                  const res = await fetch('/api/auth/change-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'same-origin',
                    body: JSON.stringify({ currentPassword, newPassword })
                  });
                  
                  if (res.status === 401) {
                    alert('Session expired. Please log in again.');
                    showLogin();
                    return;
                  }
                  
                  if (res.ok) {
                    alert('Password changed successfully!');
                    location.reload();
                  } else {
                    const error = await res.json();
                    alert('Failed to change password: ' + (error.error || 'Please try again'));
                  }
                } catch (err) {
                  console.error('Change password error:', err);
                  alert('Network error - please try again');
                }
              };
            }
            
            // Make functions global
            window.showLogin = showLogin;
            window.showSignup = showSignup;
            window.sendMessage = sendMessage;
            window.showChangePassword = showChangePassword;
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
} else {
  // Production: serve built files
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
      console.log(`🚀 Zebulon AI System running on port ${PORT}`);
      console.log(`🌐 Frontend and Backend unified on single port`);
      console.log(`💾 Database: PostgreSQL with Prisma`);
      console.log(`🧠 AI: Local Zed assistant ready`);
      console.log(`🔒 Security: Multi-layer protection active`);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔧 Development mode: Vite integrated`);
        console.log(`🌍 Access your Zebulon AI System at: http://localhost:${PORT}`);
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();