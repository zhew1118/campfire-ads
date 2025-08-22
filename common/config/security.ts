import { JWTConfig } from '../middleware/auth';
import { RateLimitConfig } from '../middleware/rateLimiting';
import { SecurityLogConfig } from '../middleware/logging';
import { SecurityConfig } from '../middleware/security';

export interface CentralizedSecurityConfig {
  environment: 'development' | 'staging' | 'production';
  jwt: JWTConfig;
  rateLimiting: {
    general: RateLimitConfig;
    rtb: RateLimitConfig;
    auth: RateLimitConfig;
    upload: RateLimitConfig;
  };
  logging: SecurityLogConfig;
  security: SecurityConfig;
  redis: {
    url: string;
    password?: string;
    db?: number;
  };
  trustedIPs?: string[];
  allowedOrigins: string[];
}

export class SecurityConfigManager {
  private config: CentralizedSecurityConfig;

  constructor(environment: string = process.env.NODE_ENV || 'development') {
    this.config = this.loadConfiguration(environment as any);
  }

  private loadConfiguration(env: 'development' | 'staging' | 'production'): CentralizedSecurityConfig {
    const baseConfig: CentralizedSecurityConfig = {
      environment: env,
      
      jwt: {
        secret: process.env.JWT_SECRET || this.generateSecret(env),
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
        issuer: 'campfire-ads-platform',
        audience: 'campfire-ads-api'
      },
      
      rateLimiting: {
        general: {
          windowMs: 15 * 60 * 1000, // 15 minutes
          maxRequests: this.getRateLimitForEnv(env, 'general'),
          redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
          message: 'Too many requests from this IP address'
        },
        
        rtb: {
          windowMs: 1000, // 1 second
          maxRequests: this.getRateLimitForEnv(env, 'rtb'),
          redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
          message: 'RTB rate limit exceeded - maximum bids per second reached'
        },
        
        auth: {
          windowMs: 15 * 60 * 1000, // 15 minutes
          maxRequests: this.getRateLimitForEnv(env, 'auth'),
          redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
          message: 'Too many authentication attempts'
        },
        
        upload: {
          windowMs: 60 * 1000, // 1 minute
          maxRequests: this.getRateLimitForEnv(env, 'upload'),
          redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
          message: 'Too many upload attempts'
        }
      },
      
      logging: {
        level: this.getLogLevelForEnv(env),
        logDirectory: process.env.LOG_DIR || './logs',
        enableConsole: env !== 'production',
        enableFile: true,
        maxFiles: env === 'production' ? 30 : 7, // 30 days in prod, 7 days in dev
        maxSize: env === 'production' ? '500m' : '100m',
        includeRequestBody: env === 'development',
        includeResponseBody: false,
        sensitiveFields: [
          'password', 'token', 'authorization', 'x-api-key', 'secret',
          'ssn', 'credit_card', 'bank_account', 'api_key', 'refresh_token',
          'client_secret', 'private_key'
        ]
      },
      
      security: {
        enableCSP: true,
        enableHSTS: env === 'production',
        enableXSSProtection: true,
        enableFrameGuard: true,
        enableNoSniff: true,
        enableReferrerPolicy: true,
        trustedDomains: this.getTrustedDomainsForEnv(env),
        customHeaders: {
          'X-Powered-By': 'Campfire Ads Platform',
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'X-XSS-Protection': '1; mode=block'
        }
      },
      
      redis: {
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB || '0')
      },
      
      allowedOrigins: this.getAllowedOriginsForEnv(env)
    };

    // Environment-specific overrides
    switch (env) {
      case 'production':
        return this.applyProductionConfig(baseConfig);
      case 'staging':
        return this.applyStagingConfig(baseConfig);
      default:
        return this.applyDevelopmentConfig(baseConfig);
    }
  }

  private applyProductionConfig(config: CentralizedSecurityConfig): CentralizedSecurityConfig {
    return {
      ...config,
      jwt: {
        ...config.jwt,
        secret: process.env.JWT_SECRET!, // Must be set in production
        expiresIn: '1h' // Shorter expiry for production
      },
      logging: {
        ...config.logging,
        level: 'warn',
        enableConsole: false,
        includeRequestBody: false
      },
      security: {
        ...config.security,
        enableHSTS: true,
        cspDirectives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "https://fonts.googleapis.com"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "https:", "data:"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          connectSrc: ["'self'", "https:"],
          frameSrc: ["'none'"],
          objectSrc: ["'none'"],
          upgradeInsecureRequests: []
        }
      },
      trustedIPs: process.env.TRUSTED_IPS?.split(',') || []
    };
  }

  private applyStagingConfig(config: CentralizedSecurityConfig): CentralizedSecurityConfig {
    return {
      ...config,
      jwt: {
        ...config.jwt,
        expiresIn: '2h'
      },
      logging: {
        ...config.logging,
        level: 'info',
        includeRequestBody: true
      }
    };
  }

  private applyDevelopmentConfig(config: CentralizedSecurityConfig): CentralizedSecurityConfig {
    return {
      ...config,
      jwt: {
        ...config.jwt,
        secret: 'development-jwt-secret-key', // Default for dev
        expiresIn: '24h'
      },
      logging: {
        ...config.logging,
        level: 'debug',
        includeRequestBody: true,
        includeResponseBody: true
      },
      security: {
        ...config.security,
        enableHSTS: false,
        cspDirectives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'", "'unsafe-eval'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:", "http:"],
          connectSrc: ["'self'", "ws:", "wss:", "http:", "https:"]
        }
      }
    };
  }

  private getRateLimitForEnv(env: string, type: string): number {
    const limits = {
      development: { general: 1000, rtb: 100, auth: 10, upload: 5 },
      staging: { general: 2000, rtb: 500, auth: 20, upload: 10 },
      production: { general: 5000, rtb: 10000, auth: 50, upload: 25 }
    };
    
    return limits[env as keyof typeof limits]?.[type as keyof typeof limits.development] || 100;
  }

  private getLogLevelForEnv(env: string): string {
    const levels = {
      development: 'debug',
      staging: 'info',
      production: 'warn'
    };
    
    return levels[env as keyof typeof levels] || 'info';
  }

  private getTrustedDomainsForEnv(env: string): string[] {
    const domains = {
      development: [
        'localhost',
        '*.localhost',
        '127.0.0.1',
        '*.campfireads.local'
      ],
      staging: [
        'localhost',
        '*.campfireads-staging.co',
        '*.staging.campfireads.co'
      ],
      production: [
        '*.campfireads.co',
        'campfireads.co',
        '*.campfireads.com',
        'campfireads.com'
      ]
    };
    
    return domains[env as keyof typeof domains] || domains.development;
  }

  private getAllowedOriginsForEnv(env: string): string[] {
    const origins = {
      development: [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:5173', // Vite default
        'http://127.0.0.1:3000'
      ],
      staging: [
        'https://staging.campfireads.co',
        'https://app-staging.campfireads.co'
      ],
      production: [
        'https://campfireads.co',
        'https://app.campfireads.co',
        'https://dashboard.campfireads.co'
      ]
    };
    
    return origins[env as keyof typeof origins] || origins.development;
  }

  private generateSecret(env: string): string {
    if (env === 'production') {
      throw new Error('JWT_SECRET must be set in production environment');
    }
    
    // Generate a consistent secret for development/staging
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(`campfire-ads-${env}`).digest('hex');
  }

  /**
   * Get the complete security configuration
   */
  getConfig(): CentralizedSecurityConfig {
    return { ...this.config };
  }

  /**
   * Get JWT configuration
   */
  getJWTConfig(): JWTConfig {
    return { ...this.config.jwt };
  }

  /**
   * Get rate limiting configuration
   */
  getRateLimitConfig(type: keyof CentralizedSecurityConfig['rateLimiting']): RateLimitConfig {
    return { ...this.config.rateLimiting[type] };
  }

  /**
   * Get logging configuration
   */
  getLoggingConfig(): SecurityLogConfig {
    return { ...this.config.logging };
  }

  /**
   * Get security headers configuration
   */
  getSecurityConfig(): SecurityConfig {
    return { ...this.config.security };
  }

  /**
   * Validate that all required environment variables are set
   */
  validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const env = this.config.environment;

    // Production-specific validations
    if (env === 'production') {
      if (!process.env.JWT_SECRET) {
        errors.push('JWT_SECRET is required in production');
      }
      
      if (!process.env.REDIS_URL || process.env.REDIS_URL.includes('localhost')) {
        errors.push('Production REDIS_URL must be set and not localhost');
      }
      
      if (this.config.jwt.secret.includes('development')) {
        errors.push('Development JWT secret detected in production');
      }
    }

    // General validations
    if (this.config.jwt.secret.length < 32) {
      errors.push('JWT secret should be at least 32 characters long');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get environment-specific service URLs
   */
  getServiceUrls(): { [service: string]: string } {
    const env = this.config.environment;
    const baseUrls = {
      development: {
        inventory: 'http://localhost:3001',
        analytics: 'http://localhost:3002',
        audio: 'http://localhost:8081',
        rss: 'http://localhost:3003',
        rtb: 'http://localhost:8080'
      },
      staging: {
        inventory: 'http://inventory-service:3001',
        analytics: 'http://analytics-service:3002',
        audio: 'http://audio-service:8081',
        rss: 'http://rss-service:3003',
        rtb: 'http://rtb-engine:8080'
      },
      production: {
        inventory: process.env.INVENTORY_SERVICE_URL || 'http://inventory-service:3001',
        analytics: process.env.ANALYTICS_SERVICE_URL || 'http://analytics-service:3002',
        audio: process.env.AUDIO_SERVICE_URL || 'http://audio-service:8081',
        rss: process.env.RSS_SERVICE_URL || 'http://rss-service:3003',
        rtb: process.env.RTB_ENGINE_URL || 'http://rtb-engine:8080'
      }
    };

    return baseUrls[env] || baseUrls.development;
  }
}

// Export a singleton instance
export const securityConfig = new SecurityConfigManager();

// Export factory function for custom environments
export const createSecurityConfig = (environment: string) => 
  new SecurityConfigManager(environment);