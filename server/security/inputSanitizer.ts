// Comprehensive Input Sanitization for Zebulon System
import validator from 'validator';
import sanitizeHtml from 'sanitize-html';

export interface SanitizationOptions {
  allowHTML: boolean;
  maxLength: number;
  stripHTML: boolean;
  normalizeWhitespace: boolean;
  allowedTags?: string[];
  allowedAttributes?: string[];
}

export class InputSanitizer {
  private static instance: InputSanitizer;

  static getInstance(): InputSanitizer {
    if (!InputSanitizer.instance) {
      InputSanitizer.instance = new InputSanitizer();
    }
    return InputSanitizer.instance;
  }

  // Sanitize general text input
  sanitizeText(input: string, options: Partial<SanitizationOptions> = {}): string {
    const config: SanitizationOptions = {
      allowHTML: false,
      maxLength: 1000,
      stripHTML: true,
      normalizeWhitespace: true,
      ...options
    };

    if (!input || typeof input !== 'string') {
      return '';
    }

    let sanitized = input;

    // Normalize whitespace
    if (config.normalizeWhitespace) {
      sanitized = sanitized.replace(/\s+/g, ' ').trim();
    }

    // Strip or sanitize HTML
    if (config.stripHTML && !config.allowHTML) {
      sanitized = this.stripHTML(sanitized);
    } else if (config.allowHTML) {
      sanitized = this.sanitizeHTML(sanitized, config);
    }

    // Enforce length limits
    if (sanitized.length > config.maxLength) {
      sanitized = sanitized.substring(0, config.maxLength);
    }

    // Remove potentially dangerous patterns
    sanitized = this.removeDangerousPatterns(sanitized);

    return sanitized;
  }

  // Sanitize HTML content safely
  sanitizeHTML(input: string, options: Partial<SanitizationOptions> = {}): string {
    const allowedTags = options.allowedTags || [
      'p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'
    ];

    const allowedAttributes = options.allowedAttributes || ['class'];

    return sanitizeHtml(input, {
      allowedTags,
      allowedAttributes: {
        '*': allowedAttributes
      },
      allowedSchemes: ['http', 'https', 'mailto'],
      disallowedTagsMode: 'discard',
      enforceHtmlBoundary: true
    });
  }

  // Strip all HTML tags
  stripHTML(input: string): string {
    return input.replace(/<[^>]*>/g, '');
  }

  // Remove dangerous patterns
  private removeDangerousPatterns(input: string): string {
    const dangerousPatterns = [
      // JavaScript protocols
      /javascript:/gi,
      /vbscript:/gi,
      /data:/gi,
      // Event handlers
      /on\w+\s*=/gi,
      // SQL injection patterns
      /union\s+select/gi,
      /drop\s+table/gi,
      /delete\s+from/gi,
      /insert\s+into/gi,
      /update\s+set/gi,
      // Path traversal
      /\.\.\//g,
      /%2e%2e%2f/gi,
      // Command injection
      /&&|\|\||;|`|\$\(/g,
      // XSS patterns
      /<script[^>]*>.*?<\/script>/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi,
      /<object[^>]*>.*?<\/object>/gi,
      /<embed[^>]*>.*?<\/embed>/gi
    ];

    return dangerousPatterns.reduce((str, pattern) => {
      return str.replace(pattern, '');
    }, input);
  }

  // Validate and sanitize email
  sanitizeEmail(email: string): string | null {
    if (!email || typeof email !== 'string') {
      return null;
    }

    const normalized = validator.normalizeEmail(email, {
      gmail_lowercase: true,
      gmail_remove_dots: false,
      gmail_remove_subaddress: false,
      outlookdotcom_lowercase: true,
      outlookdotcom_remove_subaddress: false,
      yahoo_lowercase: true,
      yahoo_remove_subaddress: false
    });

    if (normalized && validator.isEmail(normalized)) {
      return normalized;
    }

    return null;
  }

  // Validate and sanitize URL
  sanitizeURL(url: string): string | null {
    if (!url || typeof url !== 'string') {
      return null;
    }

    // Allow only HTTP and HTTPS protocols
    if (validator.isURL(url, {
      protocols: ['http', 'https'],
      require_protocol: true,
      require_valid_protocol: true,
      allow_underscores: false,
      allow_trailing_dot: false,
      allow_protocol_relative_urls: false
    })) {
      return url;
    }

    return null;
  }

  // Sanitize filename for safe file operations
  sanitizeFilename(filename: string): string {
    if (!filename || typeof filename !== 'string') {
      return 'unnamed_file';
    }

    // Remove path separators and dangerous characters
    let sanitized = filename
      .replace(/[/\\?%*:|"<>]/g, '')
      .replace(/\.\./g, '')
      .replace(/^\.+/, '')
      .trim();

    // Ensure it's not empty
    if (!sanitized) {
      sanitized = 'unnamed_file';
    }

    // Limit length
    if (sanitized.length > 255) {
      const ext = sanitized.substring(sanitized.lastIndexOf('.'));
      const name = sanitized.substring(0, 255 - ext.length);
      sanitized = name + ext;
    }

    return sanitized;
  }

  // Sanitize database query parameters
  sanitizeQueryParam(param: any): any {
    if (typeof param === 'string') {
      return this.sanitizeText(param, { maxLength: 500 });
    }
    if (typeof param === 'number') {
      return validator.isNumeric(param.toString()) ? param : 0;
    }
    if (typeof param === 'boolean') {
      return param;
    }
    if (Array.isArray(param)) {
      return param.map(item => this.sanitizeQueryParam(item));
    }
    if (typeof param === 'object' && param !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(param)) {
        const sanitizedKey = this.sanitizeText(key, { maxLength: 100 });
        sanitized[sanitizedKey] = this.sanitizeQueryParam(value);
      }
      return sanitized;
    }
    return null;
  }

  // Validate file upload
  validateFileUpload(file: any): { valid: boolean; error?: string } {
    if (!file) {
      return { valid: false, error: 'No file provided' };
    }

    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return { valid: false, error: 'File too large' };
    }

    // Check file type
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'text/plain', 'text/csv', 'text/markdown',
      'application/pdf', 'application/json',
      'audio/mpeg', 'audio/wav', 'audio/ogg',
      'video/mp4', 'video/webm'
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      return { valid: false, error: 'File type not allowed' };
    }

    // Validate filename
    const sanitizedName = this.sanitizeFilename(file.originalname);
    if (sanitizedName !== file.originalname) {
      file.originalname = sanitizedName;
    }

    return { valid: true };
  }
}

export const inputSanitizer = InputSanitizer.getInstance();