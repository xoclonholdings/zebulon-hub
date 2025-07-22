// Security Hardening Implementation for Zebulon System
import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { vulnerabilityScanner, SecurityScanResult } from './vulnerabilityScanner';

// Extend Express Request type for file uploads
interface MulterRequest extends Request {
  file?: Express.Multer.File;
  files?: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] };
}

export interface SecurityConfig {
  rateLimiting: {
    windowMs: number;
    maxRequests: number;
    skipSuccessfulRequests: boolean;
  };
  headers: {
    contentSecurityPolicy: boolean;
    crossOriginEmbedderPolicy: boolean;
    dnsPrefetchControl: boolean;
    frameguard: boolean;
    hidePoweredBy: boolean;
    hsts: boolean;
    ieNoOpen: boolean;
    noSniff: boolean;
    originAgentCluster: boolean;
    permittedCrossDomainPolicies: boolean;
    referrerPolicy: boolean;
    xssFilter: boolean;
  };
  validation: {
    strictInputValidation: boolean;
    sanitizeHTML: boolean;
    validateFileUploads: boolean;
  };
  authentication: {
    enforceStrongPasswords: boolean;
    accountLockoutEnabled: boolean;
    sessionTimeout: number;
    requireTwoFactor: boolean;
  };
}

class SecurityHardening {
  private config: SecurityConfig;
  private lastScanResult: SecurityScanResult | null = null;

  constructor() {
    this.config = {
      rateLimiting: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 100,
        skipSuccessfulRequests: false
      },
      headers: {
        contentSecurityPolicy: true,
        crossOriginEmbedderPolicy: false,
        dnsPrefetchControl: true,
        frameguard: true,
        hidePoweredBy: true,
        hsts: true,
        ieNoOpen: true,
        noSniff: true,
        originAgentCluster: true,
        permittedCrossDomainPolicies: false,
        referrerPolicy: true,
        xssFilter: true
      },
      validation: {
        strictInputValidation: true,
        sanitizeHTML: true,
        validateFileUploads: true
      },
      authentication: {
        enforceStrongPasswords: true,
        accountLockoutEnabled: true,
        sessionTimeout: 30 * 60 * 1000, // 30 minutes
        requireTwoFactor: false
      }
    };
  }

  // Enhanced Rate Limiting
  createRateLimiter(endpoint: string, customLimits?: Partial<SecurityConfig['rateLimiting']>) {
    const limits = { ...this.config.rateLimiting, ...customLimits };
    
    return rateLimit({
      windowMs: limits.windowMs,
      max: limits.maxRequests,
      message: {
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil(limits.windowMs / 1000)
      },
      standardHeaders: true,
      legacyHeaders: false,
      skip: (req) => {
        // Skip rate limiting for admin users in emergency situations
        return req.headers['x-admin-override'] === process.env.ADMIN_OVERRIDE_KEY;
      },
      handler: (req: Request, res: Response) => {
        console.warn(`Rate limit exceeded for ${endpoint}: ${req.ip}`);
        // Log potential attack patterns
        this.logSecurityEvent('rate_limit_exceeded', {
          endpoint,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          timestamp: new Date()
        });
        res.status(429).json({
          error: 'Rate limit exceeded',
          retryAfter: Math.ceil(limits.windowMs / 1000)
        });
      }
    });
  }

  // Security Headers Configuration
  applySecurityHeaders() {
    return helmet({
      contentSecurityPolicy: this.config.headers.contentSecurityPolicy ? {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Note: unsafe-eval needed for Vite dev
          imgSrc: ["'self'", "data:", "https:", "blob:"],
          connectSrc: ["'self'", "ws:", "wss:", "https:"],
          mediaSrc: ["'self'", "blob:"],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          frameAncestors: ["'none'"],
          upgradeInsecureRequests: []
        }
      } : false,
      crossOriginEmbedderPolicy: this.config.headers.crossOriginEmbedderPolicy,
      dnsPrefetchControl: this.config.headers.dnsPrefetchControl,
      frameguard: this.config.headers.frameguard ? { action: 'deny' } : false,
      hidePoweredBy: this.config.headers.hidePoweredBy,
      hsts: this.config.headers.hsts ? {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true
      } : false,
      ieNoOpen: this.config.headers.ieNoOpen,
      noSniff: this.config.headers.noSniff,
      originAgentCluster: this.config.headers.originAgentCluster,
      permittedCrossDomainPolicies: this.config.headers.permittedCrossDomainPolicies,
      referrerPolicy: this.config.headers.referrerPolicy ? { policy: 'strict-origin-when-cross-origin' } : false,
      xssFilter: this.config.headers.xssFilter
    });
  }

  // Input Validation Middleware
  validateInput() {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!this.config.validation.strictInputValidation) {
        return next();
      }

      // Check for common injection patterns
      const suspiciousPatterns = [
        /<script[^>]*>.*?<\/script>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi,
        /union\s+select/gi,
        /drop\s+table/gi,
        /delete\s+from/gi,
        /'.*or.*'.*=/gi,
        /\.\.\/\.\.\//g, // Path traversal
        /%2e%2e%2f/gi // URL encoded path traversal
      ];

      const checkInput = (input: any): boolean => {
        if (typeof input === 'string') {
          return suspiciousPatterns.some(pattern => pattern.test(input));
        }
        if (typeof input === 'object' && input !== null) {
          return Object.values(input).some(value => checkInput(value));
        }
        return false;
      };

      const requestData = { ...req.body, ...req.query, ...req.params };
      
      if (checkInput(requestData)) {
        this.logSecurityEvent('suspicious_input_detected', {
          ip: req.ip,
          path: req.path,
          data: requestData,
          timestamp: new Date()
        });
        
        return res.status(400).json({
          error: 'Invalid input detected',
          message: 'Request contains potentially malicious content'
        });
      }

      next();
    };
  }

  // File Upload Security
  validateFileUpload() {
    return (req: MulterRequest, res: Response, next: NextFunction) => {
      if (!this.config.validation.validateFileUploads) {
        return next();
      }

      // Allowed file types and extensions
      const allowedMimeTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'text/plain', 'text/csv', 'text/markdown',
        'application/pdf', 'application/json',
        'audio/mpeg', 'audio/wav', 'audio/ogg',
        'video/mp4', 'video/webm'
      ];

      const allowedExtensions = [
        '.jpg', '.jpeg', '.png', '.gif', '.webp',
        '.txt', '.csv', '.md', '.pdf', '.json',
        '.mp3', '.wav', '.ogg', '.mp4', '.webm'
      ];

      const maxFileSize = 10 * 1024 * 1024; // 10MB
      const maxFiles = 5;

      // Check if files exist in request
      if (req.files || req.file) {
        const files = Array.isArray(req.files) ? req.files : [req.file];
        
        if (files.length > maxFiles) {
          return res.status(400).json({
            error: 'Too many files',
            message: `Maximum ${maxFiles} files allowed`
          });
        }

        for (const file of files) {
          if (!file) continue;

          // Check file size
          if (file.size > maxFileSize) {
            return res.status(400).json({
              error: 'File too large',
              message: `Maximum file size is ${maxFileSize / 1024 / 1024}MB`
            });
          }

          // Check MIME type
          if (!allowedMimeTypes.includes(file.mimetype)) {
            this.logSecurityEvent('blocked_file_upload', {
              filename: file.originalname,
              mimetype: file.mimetype,
              ip: req.ip,
              timestamp: new Date()
            });
            
            return res.status(400).json({
              error: 'Invalid file type',
              message: 'File type not allowed'
            });
          }

          // Check file extension
          const ext = file.originalname.toLowerCase().substr(file.originalname.lastIndexOf('.'));
          if (!allowedExtensions.includes(ext)) {
            return res.status(400).json({
              error: 'Invalid file extension',
              message: 'File extension not allowed'
            });
          }

          // Check for embedded executables (basic check)
          if (file.buffer && this.containsExecutableSignatures(file.buffer)) {
            this.logSecurityEvent('malicious_file_detected', {
              filename: file.originalname,
              ip: req.ip,
              timestamp: new Date()
            });
            
            return res.status(400).json({
              error: 'Malicious file detected',
              message: 'File contains potentially harmful content'
            });
          }
        }
      }

      next();
    };
  }

  // Authentication Security
  enforcePasswordPolicy(password: string): { valid: boolean; errors: string[] } {
    if (!this.config.authentication.enforceStrongPasswords) {
      return { valid: true, errors: [] };
    }

    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
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
    
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    // Check against common passwords
    const commonPasswords = [
      'password', '123456', 'password123', 'admin', 'qwerty',
      'letmein', 'welcome', 'monkey', '1234567890'
    ];
    
    if (commonPasswords.includes(password.toLowerCase())) {
      errors.push('Password is too common');
    }

    return { valid: errors.length === 0, errors };
  }

  // Session Security
  configureSession() {
    return {
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: this.config.authentication.sessionTimeout,
        sameSite: 'strict' as const
      },
      rolling: true, // Reset expiration on activity
      saveUninitialized: false,
      resave: false
    };
  }

  // Security Event Logging
  private logSecurityEvent(eventType: string, data: any) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: eventType,
      severity: this.getEventSeverity(eventType),
      data,
      source: 'zebulon_security_hardening'
    };

    console.warn('SECURITY EVENT:', JSON.stringify(logEntry));
    
    // In production, this would also send to a SIEM or security monitoring service
  }

  private getEventSeverity(eventType: string): 'low' | 'medium' | 'high' | 'critical' {
    const severityMap: Record<string, 'low' | 'medium' | 'high' | 'critical'> = {
      'rate_limit_exceeded': 'medium',
      'suspicious_input_detected': 'high',
      'blocked_file_upload': 'medium',
      'malicious_file_detected': 'critical',
      'authentication_failure': 'medium',
      'privilege_escalation_attempt': 'critical'
    };
    
    return severityMap[eventType] || 'low';
  }

  private containsExecutableSignatures(buffer: Buffer): boolean {
    // Check for common executable file signatures
    const signatures = [
      Buffer.from([0x4D, 0x5A]), // PE (Windows executable)
      Buffer.from([0x7F, 0x45, 0x4C, 0x46]), // ELF (Linux executable)
      Buffer.from([0xFE, 0xED, 0xFA, 0xCE]), // Mach-O (macOS executable)
      Buffer.from([0xFE, 0xED, 0xFA, 0xCF]), // Mach-O 64-bit
    ];

    return signatures.some(sig => buffer.indexOf(sig) === 0);
  }

  // Vulnerability Assessment Integration
  async performSecurityScan(): Promise<SecurityScanResult> {
    console.log('🔒 Initiating comprehensive security vulnerability scan...');
    this.lastScanResult = await vulnerabilityScanner.performComprehensiveScan();
    return this.lastScanResult;
  }

  getLastScanResult(): SecurityScanResult | null {
    return this.lastScanResult;
  }

  // Configuration Management
  updateConfig(newConfig: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.logSecurityEvent('security_config_updated', { newConfig });
  }

  getConfig(): SecurityConfig {
    return { ...this.config };
  }

  // Emergency Security Mode
  enableEmergencyMode(): void {
    this.config = {
      ...this.config,
      rateLimiting: {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 10, // Very restrictive
        skipSuccessfulRequests: false
      },
      authentication: {
        ...this.config.authentication,
        sessionTimeout: 5 * 60 * 1000, // 5 minutes
        requireTwoFactor: true
      }
    };
    
    this.logSecurityEvent('emergency_security_mode_enabled', {
      timestamp: new Date(),
      reason: 'Manual activation'
    });
  }
}

export const securityHardening = new SecurityHardening();