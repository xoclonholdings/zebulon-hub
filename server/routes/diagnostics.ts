import { Router } from 'express';
import { storage } from '../storage';

const router = Router();

// System diagnostics and optimization endpoint
router.get('/system/diagnostics', async (req, res) => {
  try {
    const diagnostics = {
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        status: 'operational'
      },
      storage: await storage.getStorageStats(),
      performance: await storage.getPerformanceMetrics(),
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        platform: process.platform,
        nodeVersion: process.version
      }
    };
    
    res.json(diagnostics);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
});

// Storage optimization endpoint
router.post('/system/optimize', async (req, res) => {
  try {
    const result = await storage.optimizeStorage();
    res.json({
      success: true,
      optimization: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: errorMessage });
  }
});

// Error logging endpoint
router.post('/system/log-error', async (req, res) => {
  try {
    const { error, context, userId } = req.body;
    
    console.error('Frontend Error:', {
      error,
      context,
      userId,
      timestamp: new Date().toISOString()
    });
    
    res.json({ success: true, logged: true });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: errorMessage });
  }
});

export default router;