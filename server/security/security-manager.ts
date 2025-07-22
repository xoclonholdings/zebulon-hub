// Security Manager - Comprehensive security implementation for Zebulon system
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

export interface SecurityConfig {
  encryptionKey: string;
  jwtSecret: string;
  bcryptRounds: number;
  sessionTimeout: number;
  maxLoginAttempts: number;
  lockoutDuration: number;
}

export class SecurityManager {
  private config: SecurityConfig;
  private loginAttempts = new Map<string, { count: number; lastAttempt: Date; lockedUntil?: Date }>();
  
  constructor() {
    this.config = {
      encryptionKey: process.env.ENCRYPTION_KEY || this.generateSecureKey(),
      jwtSecret: process.env.JWT_SECRET || this.generateSecureKey(),
      bcryptRounds: 12,
      sessionTimeout: 30 * 60 * 1000, // 30 minutes
      maxLoginAttempts: 5,
      lockoutDuration: 15 * 60 * 1000 // 15 minutes
    };
    
    // Cleanup login attempts every hour
    setInterval(() => this.cleanupLoginAttempts(), 60 * 60 * 1000);
  }

  // Password Security
  async hashPassword(password: string): Promise<string> {
    if (!password || password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }
    return bcrypt.hash(password, this.config.bcryptRounds);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
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
    
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    // Check for common weak passwords
    const commonPasswords = ['password', '123456', 'qwerty', 'admin', 'letmein'];
    if (commonPasswords.includes(password.toLowerCase())) {
      errors.push('Password is too common');
    }
    
    return { valid: errors.length === 0, errors };
  }

  // Encryption/Decryption
  encrypt(text: string): { encrypted: string; iv: string } {
    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipher('aes-256-gcm', this.config.encryptionKey);
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      return { encrypted, iv: iv.toString('hex') };
    } catch (error) {
      throw new Error('Encryption failed');
    }
  }

  decrypt(encryptedText: string, iv: string): string {
    try {
      const decipher = crypto.createDecipher('aes-256-gcm', this.config.encryptionKey);
      let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      throw new Error('Decryption failed');
    }
  }

  // Secure data hashing
  createHash(data: string): string {
    return crypto.createHash('sha256').update(data + this.config.encryptionKey).digest('hex');
  }

  verifyHash(data: string, hash: string): boolean {
    return this.createHash(data) === hash;
  }

  // Login attempt tracking
  recordLoginAttempt(identifier: string, success: boolean): void {
    const now = new Date();
    const attempt = this.loginAttempts.get(identifier);

    if (success) {
      // Clear failed attempts on successful login
      this.loginAttempts.delete(identifier);
      return;
    }

    if (!attempt) {
      this.loginAttempts.set(identifier, { count: 1, lastAttempt: now });
    } else {
      attempt.count++;
      attempt.lastAttempt = now;
      
      if (attempt.count >= this.config.maxLoginAttempts) {
        attempt.lockedUntil = new Date(now.getTime() + this.config.lockoutDuration);
      }
    }
  }

  isAccountLocked(identifier: string): boolean {
    const attempt = this.loginAttempts.get(identifier);
    if (!attempt || !attempt.lockedUntil) return false;
    
    if (new Date() > attempt.lockedUntil) {
      // Lock expired, reset attempts
      this.loginAttempts.delete(identifier);
      return false;
    }
    
    return true;
  }

  getRemainingLockTime(identifier: string): number {
    const attempt = this.loginAttempts.get(identifier);
    if (!attempt?.lockedUntil) return 0;
    
    const remaining = attempt.lockedUntil.getTime() - Date.now();
    return Math.max(0, remaining);
  }

  private cleanupLoginAttempts(): void {
    const now = new Date();
    const toDelete: string[] = [];
    
    for (const [identifier, attempt] of Array.from(this.loginAttempts.entries())) {
      // Remove old attempts (older than 24 hours)
      const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      if (attempt.lastAttempt < dayAgo) {
        toDelete.push(identifier);
      }
      
      // Remove expired locks
      if (attempt.lockedUntil && now > attempt.lockedUntil) {
        toDelete.push(identifier);
      }
    }
    
    toDelete.forEach(id => this.loginAttempts.delete(id));
  }

  // Input sanitization
  sanitizeInput(input: string): string {
    if (typeof input !== 'string') return '';
    
    // Remove potential XSS attacks
    return input
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
  }

  // SQL injection prevention
  escapeSQL(input: string): string {
    if (typeof input !== 'string') return '';
    return input.replace(/'/g, "''").replace(/\\/g, '\\\\');
  }

  // Session token generation
  generateSessionToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // Secure random key generation
  generateSecureKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // Rate limiting configurations
  createRateLimit(windowMs: number, max: number, message?: string) {
    return rateLimit({
      windowMs,
      max,
      message: message || 'Too many requests, please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req: Request, res: Response) => {
        res.status(429).json({
          error: 'Rate limit exceeded',
          retryAfter: Math.ceil(windowMs / 1000)
        });
      }
    });
  }

  // Security middleware
  securityHeaders() {
    return (req: Request, res: Response, next: NextFunction) => {
      // Security headers
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
      res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';");
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
      
      // Remove server identification
      res.removeHeader('X-Powered-By');
      
      next();
    };
  }

  // Admin authentication security
  validateAdminCredentials(username: string, password: string): { valid: boolean; user?: any; error?: string } {
    // Default admin credentials - should be changed immediately
    const defaultAdmins = [
      { username: 'admin', password: 'zebulon2025', id: 1, role: 'admin' }
    ];

    if (this.isAccountLocked(username)) {
      const remainingTime = Math.ceil(this.getRemainingLockTime(username) / 1000 / 60);
      return { 
        valid: false, 
        error: `Account locked. Try again in ${remainingTime} minutes.` 
      };
    }

    const admin = defaultAdmins.find(a => a.username === username && a.password === password);
    
    this.recordLoginAttempt(username, !!admin);
    
    if (!admin) {
      const attempts = this.loginAttempts.get(username);
      const remaining = this.config.maxLoginAttempts - (attempts?.count || 0);
      return { 
        valid: false, 
        error: `Invalid credentials. ${remaining} attempts remaining.` 
      };
    }

    return { valid: true, user: admin };
  }

  // Oracle query security validation
  validateOracleQuery(query: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const normalizedQuery = query.toLowerCase().trim();

    // Dangerous SQL patterns
    const dangerousPatterns = [
      /drop\s+table/i,
      /drop\s+database/i,
      /truncate\s+table/i,
      /delete\s+from.*where\s*1\s*=\s*1/i,
      /update.*set.*where\s*1\s*=\s*1/i,
      /exec\s*\(/i,
      /execute\s*\(/i,
      /xp_cmdshell/i,
      /sp_executesql/i,
      /union\s+select/i,
      /;\s*drop/i,
      /;\s*delete/i,
      /;\s*update/i,
      /;\s*insert/i
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(normalizedQuery)) {
        errors.push('Query contains potentially dangerous operations');
        break;
      }
    }

    // SQL injection patterns
    const injectionPatterns = [
      /'.*or.*'.*=.*'/i,
      /'.*and.*'.*=.*'/i,
      /'\s*or\s*1\s*=\s*1/i,
      /'\s*or\s*'a'\s*=\s*'a/i,
      /'\s*;\s*drop/i,
      /\bchar\s*\(\s*\d+\s*\)/i,
      /\bconcat\s*\(/i
    ];

    for (const pattern of injectionPatterns) {
      if (pattern.test(normalizedQuery)) {
        errors.push('Query contains potential SQL injection patterns');
        break;
      }
    }

    return { valid: errors.length === 0, errors };
  }

  // File upload security
  validateFileUpload(filename: string, mimetype: string, size: number): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // File extension whitelist
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.txt', '.doc', '.docx', '.xls', '.xlsx'];
    const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    
    if (!allowedExtensions.includes(extension)) {
      errors.push('File type not allowed');
    }

    // MIME type validation
    const allowedMimeTypes = [
      'image/jpeg', 'image/png', 'image/gif',
      'application/pdf', 'text/plain',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (!allowedMimeTypes.includes(mimetype)) {
      errors.push('MIME type not allowed');
    }

    // File size limit (10MB)
    if (size > 10 * 1024 * 1024) {
      errors.push('File size exceeds 10MB limit');
    }

    // Filename validation
    if (/[<>:"/\\|?*]/.test(filename)) {
      errors.push('Filename contains invalid characters');
    }

    return { valid: errors.length === 0, errors };
  }

  // Generate security report
  generateSecurityReport(): any {
    return {
      timestamp: new Date(),
      activeLoginAttempts: this.loginAttempts.size,
      lockedAccounts: Array.from(this.loginAttempts.entries())
        .filter(([_, attempt]) => attempt.lockedUntil && new Date() < attempt.lockedUntil)
        .length,
      securityConfig: {
        bcryptRounds: this.config.bcryptRounds,
        maxLoginAttempts: this.config.maxLoginAttempts,
        lockoutDuration: this.config.lockoutDuration / 1000 / 60, // minutes
        sessionTimeout: this.config.sessionTimeout / 1000 / 60 // minutes
      },
      recommendations: [
        'Change default admin credentials immediately',
        'Enable HTTPS in production',
        'Implement API key rotation',
        'Set up monitoring for failed login attempts',
        'Regular security audits recommended'
      ]
    };
  }
}

export const securityManager = new SecurityManager();