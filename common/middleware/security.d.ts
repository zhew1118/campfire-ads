import { Request, Response, NextFunction } from 'express';
export interface SecurityConfig {
    enableCSP?: boolean;
    enableHSTS?: boolean;
    enableXSSProtection?: boolean;
    enableFrameGuard?: boolean;
    enableNoSniff?: boolean;
    enableReferrerPolicy?: boolean;
    trustedDomains?: string[];
    cspDirectives?: any;
    customHeaders?: {
        [key: string]: string;
    };
}
export declare class SecurityMiddleware {
    private config;
    constructor(config?: SecurityConfig);
    /**
     * Comprehensive security headers middleware
     */
    securityHeaders: () => any;
    /**
     * Custom security headers
     */
    customHeaders: () => (req: Request, res: Response, next: NextFunction) => void;
    /**
     * CORS configuration for different environments
     */
    corsMiddleware: () => (req: Request, res: Response, next: NextFunction) => void;
    /**
     * Request sanitization middleware
     */
    sanitizeInput: () => (req: Request, res: Response, next: NextFunction) => void;
    /**
     * IP allowlist middleware
     */
    ipAllowlist: (allowedIPs: string[]) => (req: Request, res: Response, next: NextFunction) => any;
    /**
     * Request size limiting middleware
     */
    requestSizeLimit: (maxSize?: string) => (req: Request, res: Response, next: NextFunction) => any;
    /**
     * Security monitoring middleware
     */
    securityMonitoring: () => (req: Request, res: Response, next: NextFunction) => any;
    private getDefaultCSPDirectives;
    private isOriginAllowed;
    private sanitizeObject;
    private sanitizeString;
    private getClientIP;
    private isIPAllowed;
    private parseSize;
    private formatSize;
}
export declare const createSecurityMiddleware: (config?: SecurityConfig) => SecurityMiddleware;
export declare const defaultSecurityConfig: SecurityConfig;
//# sourceMappingURL=security.d.ts.map