// Comprehensive Security Middleware for Zebulon System
import { Request, Response, NextFunction } from 'express';
import { inputSanitizer } from '../security/inputSanitizer';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

// Enhanced Request Interface
interface SecureRequest extends Request {
  sanitizedBody?: any;
  sanitizedQuery?: any;
  sanitizedParams?: any;
  securityChecked?: boolean;
}

// Input Sanitization Middleware
export const sanitizeInput = (req: SecureRequest, res: Response, next: NextFunction) => {
  try {
    // Sanitize request body
    if (req.body && typeof req.body === 'object') {
      req.sanitizedBody = inputSanitizer.sanitizeQueryParam(req.body);
      req.body = req.sanitizedBody;
    }

    // Sanitize query parameters
    if (req.query && typeof req.query === 'object') {
      req.sanitizedQuery = inputSanitizer.sanitizeQueryParam(req.query);
      req.query = req.sanitizedQuery;
    }

    // Sanitize route parameters
    if (req.params && typeof req.params === 'object') {
      req.sanitizedParams = inputSanitizer.sanitizeQueryParam(req.params);
      req.params = req.sanitizedParams;
    }

    req.securityChecked = true;
    next();
  } catch (error) {
    console.error('Input sanitization error:', error);
    res.status(400).json({
      error: 'Invalid request format',
      message: 'Request contains malformed data'
    });
  }
};

// Security Headers Middleware
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "ws:", "wss:", "https:"],
      mediaSrc: ["'self'", "blob:"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  crossOriginEmbedderPolicy: false,
  dnsPrefetchControl: true,
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: false,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true
});

// Enhanced Rate Limiting
export const createRateLimit = (windowMs: number, max: number, message?: string) => {
  return rateLimit({
    windowMs,
    max,
    message: message || 'Too many requests from this IP',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      console.warn(`Rate limit exceeded: ${req.ip} on ${req.path}`);
      res.status(429).json({
        error: 'Rate limit exceeded',
        message: 'Too many requests, please try again later',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    },
    skip: (req) => {
      // Skip rate limiting for health checks
      return req.path === '/health' || req.path === '/api/health';
    }
  });
};

// File Upload Validation Middleware
export const validateFileUpload = (req: Request, res: Response, next: NextFunction) => {
  const files = (req as any).files;
  const file = (req as any).file;

  if (files || file) {
    const filesToCheck = files ? files : [file].filter(Boolean);

    for (const fileToCheck of filesToCheck) {
      const validation = inputSanitizer.validateFileUpload(fileToCheck);
      
      if (!validation.valid) {
        return res.status(400).json({
          error: 'File validation failed',
          message: validation.error
        });
      }
    }
  }

  next();
};

// SQL Injection Detection Middleware
export const detectSQLInjection = (req: Request, res: Response, next: NextFunction) => {
  const sqlPatterns = [
    /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute|sp_|xp_)\b.*)/i,
    /((\%27)|(\')|(\")|(\%22)).*((\%6f)|o|(\%4f)).*((\%72)|r|(\%52))/i,
    /((\%27)|(\')).*(\%7c)/i,
    /;.*(\b(union|select|insert|update|delete|drop|create|alter)\b)/i,
    /((\%27)|(\')|(\")|(\%22)).*((\%6e)|n|(\%4e)).*((\%64)|d|(\%44))/i
  ];

  const checkData = (data: any): boolean => {
    if (typeof data === 'string') {
      return sqlPatterns.some(pattern => pattern.test(data));
    }
    if (typeof data === 'object' && data !== null) {
      return Object.values(data).some(value => checkData(value));
    }
    return false;
  };

  const requestData = { ...req.body, ...req.query, ...req.params };
  
  if (checkData(requestData)) {
    console.warn(`SQL injection attempt detected from ${req.ip} on ${req.path}`);
    return res.status(400).json({
      error: 'Invalid request',
      message: 'Request contains potentially harmful content'
    });
  }

  next();
};

// XSS Detection Middleware
export const detectXSS = (req: Request, res: Response, next: NextFunction) => {
  const xssPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /<object[^>]*>.*?<\/object>/gi,
    /<embed[^>]*>.*?<\/embed>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /on\w+\s*=/gi,
    /<img[^>]*src[^>]*=.*javascript:/gi,
    /<svg[^>]*onload[^>]*=/gi
  ];

  const checkData = (data: any): boolean => {
    if (typeof data === 'string') {
      return xssPatterns.some(pattern => pattern.test(data));
    }
    if (typeof data === 'object' && data !== null) {
      return Object.values(data).some(value => checkData(value));
    }
    return false;
  };

  const requestData = { ...req.body, ...req.query, ...req.params };
  
  if (checkData(requestData)) {
    console.warn(`XSS attempt detected from ${req.ip} on ${req.path}`);
    return res.status(400).json({
      error: 'Invalid request',
      message: 'Request contains potentially harmful content'
    });
  }

  next();
};

// Path Traversal Detection Middleware
export const detectPathTraversal = (req: Request, res: Response, next: NextFunction) => {
  const pathTraversalPatterns = [
    /\.\.\//g,
    /\.\.\\/g,
    /%2e%2e%2f/gi,
    /%2e%2e%5c/gi,
    /\.\.%2f/gi,
    /\.\.%5c/gi
  ];

  const checkData = (data: any): boolean => {
    if (typeof data === 'string') {
      return pathTraversalPatterns.some(pattern => pattern.test(data));
    }
    if (typeof data === 'object' && data !== null) {
      return Object.values(data).some(value => checkData(value));
    }
    return false;
  };

  const requestData = { ...req.body, ...req.query, ...req.params };
  
  if (checkData(requestData)) {
    console.warn(`Path traversal attempt detected from ${req.ip} on ${req.path}`);
    return res.status(400).json({
      error: 'Invalid request',
      message: 'Request contains potentially harmful content'
    });
  }

  next();
};

// Comprehensive Security Middleware Stack
export const comprehensiveSecurityMiddleware = [
  securityHeaders,
  sanitizeInput,
  detectSQLInjection,
  detectXSS,
  detectPathTraversal,
  validateFileUpload
];

// API-specific security middleware
export const apiSecurityMiddleware = [
  createRateLimit(15 * 60 * 1000, 100), // 100 requests per 15 minutes
  ...comprehensiveSecurityMiddleware
];

// Admin-specific security middleware
export const adminSecurityMiddleware = [
  createRateLimit(5 * 60 * 1000, 10), // 10 requests per 5 minutes
  ...comprehensiveSecurityMiddleware
];