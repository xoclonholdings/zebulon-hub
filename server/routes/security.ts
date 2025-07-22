// Security Management API Routes for Zebulon
import { Router, Request, Response } from 'express';
import { securityHardening } from '../security/securityHardening';
import { vulnerabilityScanner } from '../security/vulnerabilityScanner';
// Note: Using existing auth middleware from routes.ts
// import { isAuthenticated } from '../replitAuth';

const router = Router();

// Admin-only middleware for security routes
const requireAdmin = async (req: any, res: Response, next: Function) => {
  try {
    // Check if user has admin privileges
    const userClaims = req.user?.claims;
    if (!userClaims || userClaims.sub !== '1') { // Admin user ID
      return res.status(403).json({ 
        error: 'Forbidden', 
        message: 'Admin privileges required' 
      });
    }
    console.log('🔐 Security route accessed by admin user');
    next();
  } catch (error) {
    res.status(500).json({ error: 'Authorization check failed' });
  }
};

// Get current security configuration
router.get('/config', requireAdmin, (req: Request, res: Response) => {
  try {
    const config = securityHardening.getConfig();
    res.json({
      status: 'success',
      config,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to retrieve security configuration',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update security configuration
router.post('/config', requireAdmin, (req: Request, res: Response) => {
  try {
    const { config } = req.body;
    
    if (!config) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Security configuration required'
      });
    }

    securityHardening.updateConfig(config);
    
    res.json({
      status: 'success',
      message: 'Security configuration updated',
      config: securityHardening.getConfig()
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to update security configuration',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Perform comprehensive security scan
router.post('/scan', requireAdmin, async (req: Request, res: Response) => {
  try {
    console.log('🔍 Security scan initiated by admin user');
    
    const scanResult = await securityHardening.performSecurityScan();
    
    res.json({
      status: 'success',
      message: 'Security scan completed',
      scan: scanResult
    });
  } catch (error) {
    console.error('Security scan failed:', error);
    res.status(500).json({ 
      error: 'Security scan failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get last security scan results
router.get('/scan/latest', requireAdmin, (req: Request, res: Response) => {
  try {
    const lastScan = securityHardening.getLastScanResult();
    
    if (!lastScan) {
      return res.status(404).json({
        error: 'No scan results found',
        message: 'No security scans have been performed yet'
      });
    }

    res.json({
      status: 'success',
      scan: lastScan
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to retrieve scan results',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Enable emergency security mode
router.post('/emergency', requireAdmin, (req: Request, res: Response) => {
  try {
    securityHardening.enableEmergencyMode();
    
    res.json({
      status: 'success',
      message: 'Emergency security mode enabled',
      config: securityHardening.getConfig()
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to enable emergency mode',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Validate password strength
router.post('/validate-password', (req: Request, res: Response) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({
        error: 'Password required',
        message: 'Password field is required for validation'
      });
    }

    const validation = securityHardening.enforcePasswordPolicy(password);
    
    res.json({
      status: 'success',
      validation: {
        valid: validation.valid,
        errors: validation.errors,
        strength: validation.valid ? 'strong' : 'weak'
      }
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Password validation failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get security dashboard summary
router.get('/dashboard', requireAdmin, (req: Request, res: Response) => {
  try {
    const config = securityHardening.getConfig();
    const lastScan = securityHardening.getLastScanResult();
    
    const summary = {
      securityLevel: 'enhanced',
      lastScanDate: lastScan?.completed_at || null,
      vulnerabilityCount: lastScan?.total_vulnerabilities || 0,
      criticalIssues: lastScan?.critical_count || 0,
      highPriorityIssues: lastScan?.high_count || 0,
      riskScore: lastScan?.overall_risk_score || 0,
      securityFeatures: {
        rateLimiting: config.rateLimiting.maxRequests > 0,
        securityHeaders: config.headers.contentSecurityPolicy,
        inputValidation: config.validation.strictInputValidation,
        passwordPolicy: config.authentication.enforceStrongPasswords,
        sessionSecurity: config.authentication.sessionTimeout > 0
      },
      recommendations: lastScan?.recommendations || []
    };

    res.json({
      status: 'success',
      dashboard: summary
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to generate security dashboard',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;