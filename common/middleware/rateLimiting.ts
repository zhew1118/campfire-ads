import { Request, Response, NextFunction } from 'express';
import { createClient, RedisClientType } from 'redis';

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  message?: string;
  statusCode?: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: Request) => string;
  redisUrl?: string;
  redisClient?: RedisClientType;
}

export interface RateLimitInfo {
  limit: number;
  current: number;
  remaining: number;
  resetTime: number;
}

export class RateLimiter {
  private config: Required<RateLimitConfig>;
  private redis: RedisClientType;
  private isRedisConnected = false;

  constructor(config: RateLimitConfig) {
    this.config = {
      windowMs: config.windowMs,
      maxRequests: config.maxRequests,
      message: config.message || 'Too many requests, please try again later',
      statusCode: config.statusCode || 429,
      skipSuccessfulRequests: config.skipSuccessfulRequests || false,
      skipFailedRequests: config.skipFailedRequests || false,
      keyGenerator: config.keyGenerator || this.defaultKeyGenerator,
      redisUrl: config.redisUrl || 'redis://localhost:6379',
      redisClient: config.redisClient as any
    };

    this.redis = this.config.redisClient || createClient({ 
      url: this.config.redisUrl,
      socket: {
        reconnectStrategy: (retries) => Math.min(retries * 50, 1000)
      }
    });

    this.initializeRedis();
  }

  private async initializeRedis() {
    if (!this.config.redisClient) {
      try {
        await this.redis.connect();
        this.isRedisConnected = true;
        console.log('Rate limiter connected to Redis');
      } catch (error) {
        console.error('Rate limiter failed to connect to Redis:', error);
        this.isRedisConnected = false;
      }
    } else {
      this.isRedisConnected = true;
    }
  }

  private defaultKeyGenerator(req: Request): string {
    return `rate_limit:${req.ip}:${req.path}`;
  }

  /**
   * Standard rate limiting middleware
   */
  middleware = () => {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const key = this.config.keyGenerator(req);
        const result = await this.checkLimit(key);

        // Add rate limit headers
        res.set({
          'X-RateLimit-Limit': result.limit.toString(),
          'X-RateLimit-Remaining': Math.max(0, result.remaining).toString(),
          'X-RateLimit-Reset': new Date(result.resetTime).toISOString()
        });

        if (result.current > result.limit) {
          return res.status(this.config.statusCode).json({
            error: this.config.message,
            code: 'RATE_LIMIT_EXCEEDED',
            rateLimit: {
              limit: result.limit,
              current: result.current,
              remaining: 0,
              resetTime: result.resetTime
            }
          });
        }

        // Track the request result for conditional counting
        const originalEnd = res.end;
        const self = this;
        res.end = function(this: any, ...args: any[]) {
          const shouldSkip = 
            (self.config.skipSuccessfulRequests && res.statusCode < 400) ||
            (self.config.skipFailedRequests && res.statusCode >= 400);

          if (!shouldSkip) {
            // Count this request asynchronously
            self.incrementCounter(key).catch(console.error);
          }

          return (originalEnd as any).apply(this, args);
        } as any;

        next();
      } catch (error) {
        console.error('Rate limiting error:', error);
        // Continue without rate limiting if Redis fails
        next();
      }
    };
  };

  /**
   * RTB-specific ultra-fast rate limiting (for <10ms requirements)
   */
  rtbMiddleware = (maxRequestsPerSecond: number = 10000) => {
    const windowMs = 1000; // 1 second window
    
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const key = `rtb_limit:${req.ip}:${Math.floor(Date.now() / windowMs)}`;
        const current = await this.getQuickCount(key);
        
        if (current >= maxRequestsPerSecond) {
          return res.status(429).json({
            error: 'RTB rate limit exceeded',
            code: 'RTB_RATE_LIMIT_EXCEEDED'
          });
        }

        // Increment counter immediately for RTB speed
        await this.quickIncrement(key, windowMs / 1000);
        next();
      } catch (error) {
        console.error('RTB rate limiting error:', error);
        next(); // Continue without rate limiting if Redis fails
      }
    };
  };

  /**
   * Advanced rate limiting with different limits per endpoint
   */
  advancedMiddleware = (limits: { [endpoint: string]: RateLimitConfig }) => {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const endpoint = this.getEndpointKey(req);
        const config = limits[endpoint] || limits['default'];
        
        if (!config) {
          return next();
        }

        const key = `advanced_limit:${req.ip}:${endpoint}`;
        const result = await this.checkLimit(key, config.windowMs, config.maxRequests);

        res.set({
          'X-RateLimit-Limit': result.limit.toString(),
          'X-RateLimit-Remaining': Math.max(0, result.remaining).toString(),
          'X-RateLimit-Reset': new Date(result.resetTime).toISOString()
        });

        if (result.current > result.limit) {
          return res.status(config.statusCode || 429).json({
            error: config.message || this.config.message,
            code: 'ENDPOINT_RATE_LIMIT_EXCEEDED',
            endpoint
          });
        }

        await this.incrementCounter(key, config.windowMs / 1000);
        next();
      } catch (error) {
        console.error('Advanced rate limiting error:', error);
        next();
      }
    };
  };

  private async checkLimit(key: string, windowMs?: number, maxRequests?: number): Promise<RateLimitInfo> {
    if (!this.isRedisConnected) {
      throw new Error('Redis not connected');
    }

    const window = windowMs || this.config.windowMs;
    const limit = maxRequests || this.config.maxRequests;
    const now = Date.now();
    const windowStart = now - window;

    // Remove expired entries and count current requests
    await this.redis.zRemRangeByScore(key, 0, windowStart);
    const current = await this.redis.zCard(key);
    
    return {
      limit,
      current,
      remaining: limit - current,
      resetTime: now + window
    };
  }

  private async incrementCounter(key: string, expireSeconds?: number): Promise<void> {
    if (!this.isRedisConnected) return;

    const now = Date.now();
    const expire = expireSeconds || (this.config.windowMs / 1000);

    await this.redis.multi()
      .zAdd(key, {score: now, value: `${now}-${Math.random()}`})
      .expire(key, expire)
      .exec();
  }

  private async getQuickCount(key: string): Promise<number> {
    if (!this.isRedisConnected) return 0;
    
    const count = await this.redis.incr(key);
    if (count === 1) {
      await this.redis.expire(key, 1); // 1 second expiry
    }
    return count;
  }

  private async quickIncrement(key: string, expireSeconds: number): Promise<void> {
    if (!this.isRedisConnected) return;
    
    await this.redis.multi()
      .incr(key)
      .expire(key, expireSeconds)
      .exec();
  }

  private getEndpointKey(req: Request): string {
    // Create a normalized endpoint key
    const path = req.route?.path || req.path;
    const method = req.method.toLowerCase();
    return `${method}:${path}`;
  }

  /**
   * Get current rate limit status for a key
   */
  async getStatus(req: Request): Promise<RateLimitInfo> {
    const key = this.config.keyGenerator(req);
    return await this.checkLimit(key);
  }

  /**
   * Reset rate limit for a specific key
   */
  async reset(req: Request): Promise<void> {
    const key = this.config.keyGenerator(req);
    if (this.isRedisConnected) {
      await this.redis.del(key);
    }
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    if (this.isRedisConnected && !this.config.redisClient) {
      await this.redis.disconnect();
      this.isRedisConnected = false;
    }
  }
}

// Export factory function for creating rate limiters
export const createRateLimiter = (config: RateLimitConfig) => new RateLimiter(config);

// Export commonly used rate limiting configurations
export const commonLimits = {
  // API Gateway general limit
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 1000,
    message: 'Too many requests from this IP'
  },
  
  // RTB bidding (ultra-strict)
  rtb: {
    windowMs: 1000, // 1 second
    maxRequests: 100,
    message: 'RTB rate limit exceeded'
  },
  
  // Authentication endpoints
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 10,
    message: 'Too many authentication attempts'
  },
  
  // File upload endpoints
  upload: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5,
    message: 'Too many upload attempts'
  }
};