import { Request, Response, NextFunction } from 'express';
import { RedisClientType } from 'redis';
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
export declare class RateLimiter {
    private config;
    private redis;
    private isRedisConnected;
    constructor(config: RateLimitConfig);
    private initializeRedis;
    private defaultKeyGenerator;
    /**
     * Standard rate limiting middleware
     */
    middleware: () => (req: Request, res: Response, next: NextFunction) => Promise<any>;
    /**
     * RTB-specific ultra-fast rate limiting (for <10ms requirements)
     */
    rtbMiddleware: (maxRequestsPerSecond?: number) => (req: Request, res: Response, next: NextFunction) => Promise<any>;
    /**
     * Advanced rate limiting with different limits per endpoint
     */
    advancedMiddleware: (limits: {
        [endpoint: string]: RateLimitConfig;
    }) => (req: Request, res: Response, next: NextFunction) => Promise<any>;
    private checkLimit;
    private incrementCounter;
    private getQuickCount;
    private quickIncrement;
    private getEndpointKey;
    /**
     * Get current rate limit status for a key
     */
    getStatus(req: Request): Promise<RateLimitInfo>;
    /**
     * Reset rate limit for a specific key
     */
    reset(req: Request): Promise<void>;
    /**
     * Close Redis connection
     */
    close(): Promise<void>;
}
export declare const createRateLimiter: (config: RateLimitConfig) => RateLimiter;
export declare const commonLimits: {
    api: {
        windowMs: number;
        maxRequests: number;
        message: string;
    };
    rtb: {
        windowMs: number;
        maxRequests: number;
        message: string;
    };
    auth: {
        windowMs: number;
        maxRequests: number;
        message: string;
    };
    upload: {
        windowMs: number;
        maxRequests: number;
        message: string;
    };
};
//# sourceMappingURL=rateLimiting.d.ts.map