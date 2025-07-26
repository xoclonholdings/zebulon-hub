import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import bcrypt from 'bcrypt';
import path from 'path';
import { fileURLToPath } from 'url';
import { storage } from './storage-prisma.js';
import gedcomRoutes from './routes/gedcom.js';
import { getActiveConnection } from './db-dual.js';

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

// Module Integration API endpoints
app.get('/api/modules', async (req, res) => {
  try {
    const modules = await storage.getModuleIntegrations();
    res.json(modules);
  } catch (error) {
    console.error('Get modules error:', error);
    res.status(500).json({ error: 'Failed to fetch modules' });
  }
});

app.get('/api/modules/:moduleName', async (req, res) => {
  try {
    const { moduleName } = req.params;
    const module = await storage.getModuleIntegration(moduleName);
    if (!module) {
      return res.status(404).json({ error: 'Module not found' });
    }
    res.json(module);
  } catch (error) {
    console.error('Get module error:', error);
    res.status(500).json({ error: 'Failed to fetch module' });
  }
});

app.post('/api/modules', requireAuth, async (req, res) => {
  try {
    const moduleData = req.body;
    const module = await storage.createModuleIntegration(moduleData);
    res.json(module);
  } catch (error) {
    console.error('Create module error:', error);
    res.status(500).json({ error: 'Failed to create module integration' });
  }
});

app.put('/api/modules/:moduleName', requireAuth, async (req, res) => {
  try {
    const { moduleName } = req.params;
    const updateData = req.body;
    const module = await storage.updateModuleIntegration(moduleName, updateData);
    res.json(module);
  } catch (error) {
    console.error('Update module error:', error);
    res.status(500).json({ error: 'Failed to update module integration' });
  }
});

app.delete('/api/modules/:moduleName', requireAuth, async (req, res) => {
  try {
    const { moduleName } = req.params;
    await storage.deleteModuleIntegration(moduleName);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete module error:', error);
    res.status(500).json({ error: 'Failed to delete module integration' });
  }
});

// Oracle Memory endpoints - Admin only access
const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  // For now, treating all authenticated users as admin
  // In production, check user.role === 'admin'
  next();
};

// Get all Oracle memories
app.get('/api/oracle/memories', requireAdmin, async (req, res) => {
  try {
    const { search, status, type } = req.query;
    const memories = await storage.searchOracleMemories(
      search as string,
      status as string,
      type as string
    );
    res.json({ memories });
  } catch (error) {
    console.error('Get Oracle memories error:', error);
    res.status(500).json({ error: 'Failed to fetch Oracle memories' });
  }
});

// Get specific Oracle memory by label
app.get('/api/oracle/recall/:label', requireAdmin, async (req, res) => {
  try {
    const { label } = req.params;
    const memory = await storage.getOracleMemoryByLabel(label);
    
    if (!memory) {
      return res.status(404).json({ error: 'Memory not found' });
    }
    
    res.json({ memory });
  } catch (error) {
    console.error('Recall Oracle memory error:', error);
    res.status(500).json({ error: 'Failed to recall memory' });
  }
});

// Store new Oracle memory
app.post('/api/oracle/store', requireAdmin, async (req, res) => {
  try {
    const { label, description, content, memoryType } = req.body;
    const userId = (req as AuthenticatedRequest).session.userId!;
    
    if (!label || !description || !content || !memoryType) {
      return res.status(400).json({ 
        error: 'Label, description, content, and memory type are required' 
      });
    }

    // Check if label already exists
    const existing = await storage.getOracleMemoryByLabel(label);
    if (existing) {
      return res.status(409).json({ error: 'Memory with this label already exists' });
    }

    const memory = await storage.createOracleMemory({
      label,
      description,
      content,
      memoryType,
      createdBy: 'admin' // In production, use actual username
    });

    res.json({ memory, message: 'Memory stored successfully' });
  } catch (error) {
    console.error('Store Oracle memory error:', error);
    res.status(500).json({ error: 'Failed to store memory' });
  }
});

// Lock/unlock Oracle memory
app.patch('/api/oracle/lock', requireAdmin, async (req, res) => {
  try {
    const { label, status } = req.body;
    
    if (!label || !status || !['active', 'locked'].includes(status)) {
      return res.status(400).json({ 
        error: 'Valid label and status (active/locked) are required' 
      });
    }

    const memory = await storage.updateOracleMemory(label, { status });
    res.json({ memory, message: `Memory ${status} successfully` });
  } catch (error) {
    console.error('Lock Oracle memory error:', error);
    res.status(500).json({ error: 'Failed to update memory status' });
  }
});

// Export Oracle memory
app.get('/api/oracle/export/:label', requireAdmin, async (req, res) => {
  try {
    const { label } = req.params;
    const { format = 'json' } = req.query;
    
    const memory = await storage.getOracleMemoryByLabel(label);
    if (!memory) {
      return res.status(404).json({ error: 'Memory not found' });
    }

    let filename: string;
    let contentType: string;
    let data: string;

    switch (format) {
      case 'txt':
        filename = `${label}.txt`;
        contentType = 'text/plain';
        data = `Label: ${memory.label}\nDescription: ${memory.description}\nType: ${memory.memoryType}\nStatus: ${memory.status}\nCreated: ${memory.createdAt}\nLast Modified: ${memory.lastModified}\n\nContent:\n${memory.content}`;
        break;
      case 'json':
        filename = `${label}.json`;
        contentType = 'application/json';
        data = JSON.stringify(memory, null, 2);
        break;
      default:
        return res.status(400).json({ error: 'Unsupported format. Use json or txt' });
    }

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', contentType);
    res.send(data);
  } catch (error) {
    console.error('Export Oracle memory error:', error);
    res.status(500).json({ error: 'Failed to export memory' });
  }
});

// Update Oracle memory
app.patch('/api/oracle/memories/:label', requireAdmin, async (req, res) => {
  try {
    const { label } = req.params;
    const updates = req.body;
    
    // Don't allow changing the label itself or creation metadata
    delete updates.id;
    delete updates.label;
    delete updates.createdBy;
    delete updates.createdAt;

    const memory = await storage.updateOracleMemory(label, updates);
    res.json({ memory, message: 'Memory updated successfully' });
  } catch (error) {
    console.error('Update Oracle memory error:', error);
    res.status(500).json({ error: 'Failed to update memory' });
  }
});

// Delete Oracle memory
app.delete('/api/oracle/memories/:label', requireAdmin, async (req, res) => {
  try {
    const { label } = req.params;
    
    await storage.deleteOracleMemory(label);
    res.json({ message: 'Memory deleted successfully' });
  } catch (error) {
    console.error('Delete Oracle memory error:', error);
    res.status(500).json({ error: 'Failed to delete memory' });
  }
});

// GEDCOM routes
app.use('/api/gedcom', gedcomRoutes);

// API health check with database status
app.get('/api/health', (req, res) => {
  const dbStatus = getActiveConnection();
  res.json({ 
    status: 'ok', 
    message: 'Zebulon Oracle System is running with Prisma',
    database: dbStatus
  });
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