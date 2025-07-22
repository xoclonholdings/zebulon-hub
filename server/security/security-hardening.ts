import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

// Rate limiting configurations
export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit authentication attempts
  message: {
    error: 'Too many authentication attempts, please try again later.',
    code: 'AUTH_RATE_LIMIT_EXCEEDED'
  },
  skipSuccessfulRequests: true,
});

export const strictRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // Very strict for sensitive operations
  message: {
    error: 'Rate limit exceeded for sensitive operations.',
    code: 'STRICT_RATE_LIMIT_EXCEEDED'
  },
});

// Input sanitization middleware
export function sanitizeInput(req: Request, res: Response, next: NextFunction) {
  const sanitizeValue = (value: any): any => {
    if (typeof value === 'string') {
      // Remove potentially dangerous characters
      return value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .trim();
    }
    if (typeof value === 'object' && value !== null) {
      const sanitized: any = Array.isArray(value) ? [] : {};
      for (const key in value) {
        sanitized[key] = sanitizeValue(value[key]);
      }
      return sanitized;
    }
    return value;
  };

  if (req.body) {
    req.body = sanitizeValue(req.body);
  }
  if (req.query) {
    req.query = sanitizeValue(req.query);
  }
  if (req.params) {
    req.params = sanitizeValue(req.params);
  }

  next();
}

// CSRF protection middleware
const csrfTokens = new Map<string, { token: string; expires: number }>();

export function generateCSRFToken(sessionId: string): string {
  const token = crypto.randomBytes(32).toString('hex');
  const expires = Date.now() + (60 * 60 * 1000); // 1 hour
  
  csrfTokens.set(sessionId, { token, expires });
  
  // Clean up expired tokens
  setTimeout(() => {
    const tokenData = csrfTokens.get(sessionId);
    if (tokenData && tokenData.expires < Date.now()) {
      csrfTokens.delete(sessionId);
    }
  }, 60 * 60 * 1000);
  
  return token;
}

export function validateCSRFToken(req: any, res: Response, next: NextFunction) {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return next();
  }

  const sessionId = req.session?.id;
  const providedToken = req.headers['x-csrf-token'] || req.body?.csrfToken;

  if (!sessionId || !providedToken) {
    return res.status(403).json({ error: 'CSRF token missing' });
  }

  const tokenData = csrfTokens.get(sessionId);
  if (!tokenData || tokenData.token !== providedToken || tokenData.expires < Date.now()) {
    return res.status(403).json({ error: 'Invalid or expired CSRF token' });
  }

  next();
}

// Security headers middleware
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  // Content Security Policy
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "connect-src 'self' ws: wss:; " +
    "font-src 'self'; " +
    "object-src 'none'; " +
    "media-src 'self'; " +
    "frame-src 'none';"
  );

  // HSTS
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  
  // X-Content-Type-Options
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // X-Frame-Options
  res.setHeader('X-Frame-Options', 'DENY');
  
  // X-XSS-Protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  next();
}

// Authentication middleware
export function requireAuth(req: any, res: Response, next: NextFunction) {
  if (!req.session?.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

// Authorization middleware
export function requireRole(roles: string[]) {
  return (req: any, res: Response, next: NextFunction) => {
    if (!req.session?.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const userRole = req.session.user.role || 'user';
    if (!roles.includes(userRole)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
}

// Input validation helpers
export function validateUserId(userId: any): number {
  const id = parseInt(userId);
  if (isNaN(id) || id <= 0) {
    throw new Error('Invalid user ID');
  }
  return id;
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < 12) {
    errors.push('Password must be at least 12 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  // Check for common weak passwords
  const commonPasswords = ['password123', 'admin123', 'qwerty123', '123456789'];
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('Password is too common');
  }
  
  return { valid: errors.length === 0, errors };
}

// Session security configuration
export const sessionConfig = {
  secret: process.env.SESSION_SECRET || crypto.randomBytes(64).toString('hex'),
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'strict' as const
  },
  rolling: true // Reset expiration on activity
};

// Path traversal protection
export function sanitizePath(filePath: string): string {
  // Remove any path traversal attempts
  return filePath
    .replace(/\.\./g, '')
    .replace(/[\/\\]+/g, '/')
    .replace(/^\/+/, '');
}

// Audit logging
export interface AuditEvent {
  timestamp: string;
  userId?: number;
  action: string;
  resource: string;
  success: boolean;
  ipAddress: string;
  userAgent: string;
  details?: any;
}

class AuditLogger {
  private events: AuditEvent[] = [];
  
  log(event: Omit<AuditEvent, 'timestamp'>) {
    const auditEvent: AuditEvent = {
      ...event,
      timestamp: new Date().toISOString()
    };
    
    this.events.push(auditEvent);
    console.log(`🔒 AUDIT: ${auditEvent.action} on ${auditEvent.resource} by ${auditEvent.userId || 'anonymous'} - ${auditEvent.success ? 'SUCCESS' : 'FAILED'}`);
    
    // Keep only last 1000 events in memory
    if (this.events.length > 1000) {
      this.events = this.events.slice(-1000);
    }
  }
  
  getEvents(limit = 100): AuditEvent[] {
    return this.events.slice(-limit);
  }
  
  getEventsByUser(userId: number, limit = 100): AuditEvent[] {
    return this.events
      .filter(event => event.userId === userId)
      .slice(-limit);
  }
}

export const auditLogger = new AuditLogger();

// Security middleware factory
export function createSecurityMiddleware(req: any, res: Response, next: NextFunction) {
  // Add security context to request
  req.security = {
    auditLog: (action: string, resource: string, success: boolean, details?: any) => {
      auditLogger.log({
        userId: req.session?.user?.id,
        action,
        resource,
        success,
        ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
        details
      });
    }
  };
  
  next();
}