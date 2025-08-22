import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';

export interface SecurityConfig {
  enableCSP?: boolean;
  enableHSTS?: boolean;
  enableXSSProtection?: boolean;
  enableFrameGuard?: boolean;
  enableNoSniff?: boolean;
  enableReferrerPolicy?: boolean;
  trustedDomains?: string[];
  cspDirectives?: any;
  customHeaders?: { [key: string]: string };
}

export class SecurityMiddleware {
  private config: Required<SecurityConfig>;

  constructor(config: SecurityConfig = {}) {
    this.config = {
      enableCSP: config.enableCSP !== false,
      enableHSTS: config.enableHSTS !== false,
      enableXSSProtection: config.enableXSSProtection !== false,
      enableFrameGuard: config.enableFrameGuard !== false,
      enableNoSniff: config.enableNoSniff !== false,
      enableReferrerPolicy: config.enableReferrerPolicy !== false,
      trustedDomains: config.trustedDomains || [
        'localhost',
        '*.campfireads.co',
        'campfireads.co'
      ],
      cspDirectives: config.cspDirectives || this.getDefaultCSPDirectives(),
      customHeaders: config.customHeaders || {}
    };
  }

  /**
   * Comprehensive security headers middleware
   */
  securityHeaders = () => {
    const helmetConfig: any = {};

    // Content Security Policy
    if (this.config.enableCSP) {
      helmetConfig.contentSecurityPolicy = {
        directives: this.config.cspDirectives,
        reportOnly: process.env.NODE_ENV === 'development'
      };
    }

    // HTTP Strict Transport Security
    if (this.config.enableHSTS) {
      helmetConfig.hsts = {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true
      };
    }

    // X-Frame-Options
    if (this.config.enableFrameGuard) {
      helmetConfig.frameguard = {
        action: 'deny' // Prevent embedding in iframes
      };
    }

    // X-XSS-Protection
    if (this.config.enableXSSProtection) {
      helmetConfig.xssFilter = true;
    }

    // X-Content-Type-Options
    if (this.config.enableNoSniff) {
      helmetConfig.noSniff = true;
    }

    // Referrer Policy
    if (this.config.enableReferrerPolicy) {
      helmetConfig.referrerPolicy = {
        policy: ['strict-origin-when-cross-origin']
      };
    }

    return helmet(helmetConfig);
  };

  /**
   * Custom security headers
   */
  customHeaders = () => {
    return (req: Request, res: Response, next: NextFunction) => {
      // Add API-specific security headers
      res.setHeader('X-API-Version', process.env.API_VERSION || '1.0');
      res.setHeader('X-Service-Name', 'campfire-ads-api');
      
      // Prevent caching of sensitive responses
      if (req.path.includes('/auth') || req.path.includes('/admin')) {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('Surrogate-Control', 'no-store');
      }

      // RTB-specific headers for performance
      if (req.path.includes('/rtb') || req.path.includes('/ads/bid')) {
        res.setHeader('X-RTB-Version', '2.5');
        res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours for RTB preflight caching
      }

      // Add custom headers from config
      Object.entries(this.config.customHeaders).forEach(([key, value]) => {
        res.setHeader(key, value);
      });

      next();
    };
  };

  /**
   * CORS configuration for different environments
   */
  corsMiddleware = () => {
    return (req: Request, res: Response, next: NextFunction) => {
      const origin = req.headers.origin;
      const isAllowedOrigin = this.isOriginAllowed(origin);

      if (isAllowedOrigin) {
        res.setHeader('Access-Control-Allow-Origin', origin || '*');
      }

      // Allow credentials for authenticated requests
      res.setHeader('Access-Control-Allow-Credentials', 'true');

      // Allow specific methods
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');

      // Allow specific headers
      res.setHeader('Access-Control-Allow-Headers', [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'X-API-Key',
        'X-Request-ID',
        'X-RTB-Version'
      ].join(', '));

      // Expose specific headers
      res.setHeader('Access-Control-Expose-Headers', [
        'X-RateLimit-Limit',
        'X-RateLimit-Remaining',
        'X-RateLimit-Reset',
        'X-Request-ID',
        'X-Response-Time'
      ].join(', '));

      // Handle preflight requests
      if (req.method === 'OPTIONS') {
        res.status(204).end();
        return;
      }

      next();
    };
  };

  /**
   * Request sanitization middleware
   */
  sanitizeInput = () => {
    return (req: Request, res: Response, next: NextFunction) => {
      // Sanitize query parameters
      if (req.query) {
        req.query = this.sanitizeObject(req.query);
      }

      // Sanitize request body
      if (req.body && typeof req.body === 'object') {
        req.body = this.sanitizeObject(req.body);
      }

      // Sanitize URL parameters
      if (req.params) {
        req.params = this.sanitizeObject(req.params);
      }

      next();
    };
  };

  /**
   * IP allowlist middleware
   */
  ipAllowlist = (allowedIPs: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
      const clientIP = this.getClientIP(req);
      
      if (!this.isIPAllowed(clientIP, allowedIPs)) {
        return res.status(403).json({
          error: 'Access denied from this IP address',
          code: 'IP_NOT_ALLOWED'
        });
      }

      next();
    };
  };

  /**
   * Request size limiting middleware
   */
  requestSizeLimit = (maxSize: string = '10mb') => {
    return (req: Request, res: Response, next: NextFunction) => {
      const contentLength = parseInt(req.headers['content-length'] || '0');
      const maxBytes = this.parseSize(maxSize);

      if (contentLength > maxBytes) {
        return res.status(413).json({
          error: 'Request payload too large',
          code: 'PAYLOAD_TOO_LARGE',
          maxSize,
          receivedSize: this.formatSize(contentLength)
        });
      }

      next();
    };
  };

  /**
   * Security monitoring middleware
   */
  securityMonitoring = () => {
    return (req: Request, res: Response, next: NextFunction) => {
      const suspiciousPatterns = [
        /\.\./,                    // Path traversal
        /<script|javascript:/i,    // XSS attempts
        /union\s+select/i,         // SQL injection
        /exec\s*\(/i,              // Code execution
        /system\s*\(/i,            // System calls
        /__proto__/,               // Prototype pollution
        /constructor/,             // Constructor manipulation
      ];

      const requestString = JSON.stringify({
        url: req.url,
        query: req.query,
        body: req.body,
        headers: req.headers
      });

      const isSuspicious = suspiciousPatterns.some(pattern => 
        pattern.test(requestString)
      );

      if (isSuspicious) {
        // Log security incident (would integrate with logging middleware)
        console.warn('Suspicious request detected:', {
          ip: this.getClientIP(req),
          url: req.url,
          userAgent: req.headers['user-agent'],
          timestamp: new Date().toISOString()
        });

        return res.status(400).json({
          error: 'Request contains suspicious content',
          code: 'SUSPICIOUS_REQUEST'
        });
      }

      next();
    };
  };

  private getDefaultCSPDirectives() {
    return {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "'unsafe-eval'"], // unsafe-eval needed for some analytics
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      connectSrc: ["'self'", "https:", "wss:"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'", "https:", "data:"],
      workerSrc: ["'self'", "blob:"],
      childSrc: ["'self'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: [],
    };
  }

  private isOriginAllowed(origin?: string): boolean {
    if (!origin) return true; // Allow requests without origin (non-browser)

    return this.config.trustedDomains.some(domain => {
      if (domain.startsWith('*.')) {
        const baseDomain = domain.substring(2);
        return origin.endsWith(baseDomain);
      }
      return origin.includes(domain);
    });
  }

  private sanitizeObject(obj: any): any {
    if (typeof obj !== 'object' || obj === null) {
      return this.sanitizeString(obj);
    }

    const sanitized: any = Array.isArray(obj) ? [] : {};

    for (const [key, value] of Object.entries(obj)) {
      const sanitizedKey = this.sanitizeString(key);
      sanitized[sanitizedKey] = typeof value === 'object' 
        ? this.sanitizeObject(value)
        : this.sanitizeString(value);
    }

    return sanitized;
  }

  private sanitizeString(value: any): any {
    if (typeof value !== 'string') return value;

    return value
      .replace(/[<>]/g, '') // Remove basic XSS chars
      .replace(/javascript:/gi, '') // Remove javascript: protocols
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .trim();
  }

  private getClientIP(req: Request): string {
    return (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
           req.headers['x-real-ip'] as string ||
           req.connection?.remoteAddress ||
           req.socket?.remoteAddress ||
           'unknown';
  }

  private isIPAllowed(clientIP: string, allowedIPs: string[]): boolean {
    return allowedIPs.some(allowedIP => {
      if (allowedIP.includes('/')) {
        // CIDR notation support would require additional library
        return false;
      }
      return clientIP === allowedIP;
    });
  }

  private parseSize(size: string): number {
    const units = { b: 1, kb: 1024, mb: 1024 ** 2, gb: 1024 ** 3 };
    const match = size.toLowerCase().match(/^(\d+)(b|kb|mb|gb)?$/);
    
    if (!match) return 0;
    
    const value = parseInt(match[1]);
    const unit = (match[2] as keyof typeof units) || 'b';
    
    return value * units[unit];
  }

  private formatSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(2)}${units[unitIndex]}`;
  }
}

// Export factory function
export const createSecurityMiddleware = (config?: SecurityConfig) => 
  new SecurityMiddleware(config);

// Export default security configuration
export const defaultSecurityConfig: SecurityConfig = {
  enableCSP: true,
  enableHSTS: process.env.NODE_ENV === 'production',
  enableXSSProtection: true,
  enableFrameGuard: true,
  enableNoSniff: true,
  enableReferrerPolicy: true,
  trustedDomains: [
    'localhost',
    '*.campfireads.co',
    'campfireads.co',
    '*.localhost'
  ],
  customHeaders: {
    'X-Powered-By': 'Campfire Ads Platform',
    'X-Content-Type-Options': 'nosniff'
  }
};