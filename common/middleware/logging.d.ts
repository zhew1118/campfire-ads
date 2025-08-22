import { Request, Response, NextFunction } from 'express';
import winston from 'winston';
import { AuthenticatedRequest } from './auth';
export interface SecurityLogConfig {
    level: string;
    logDirectory?: string;
    enableConsole?: boolean;
    enableFile?: boolean;
    maxFiles?: number;
    maxSize?: string;
    includeRequestBody?: boolean;
    includeResponseBody?: boolean;
    sensitiveFields?: string[];
    logRotation?: boolean;
}
export interface LogContext {
    requestId: string;
    userId?: string;
    userRole?: string;
    ip: string;
    userAgent: string;
    method: string;
    url: string;
    timestamp: string;
    duration?: number;
    statusCode?: number;
    error?: any;
    metadata?: any;
}
export declare class SecurityLogger {
    private logger;
    private config;
    constructor(config: SecurityLogConfig);
    private createLogger;
    /**
     * Request/Response logging middleware
     */
    requestLogger: () => (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
    /**
     * Security event logging middleware
     */
    securityEventLogger: () => (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
    /**
     * RTB performance logging middleware
     */
    rtbLogger: () => (req: Request, res: Response, next: NextFunction) => any;
    private logRequest;
    private logResponse;
    /**
     * Log security events
     */
    logSecurityEvent(eventType: string, req: Request, metadata?: any): void;
    /**
     * Log authentication events
     */
    logAuthEvent(eventType: 'LOGIN' | 'LOGOUT' | 'TOKEN_REFRESH' | 'PASSWORD_CHANGE', userId: string, req: Request, metadata?: any): void;
    /**
     * Log business events
     */
    logBusinessEvent(eventType: string, data: any): void;
    private sanitizeData;
    private getClientIP;
    private generateRequestId;
    /**
     * Get the underlying Winston logger
     */
    getLogger(): winston.Logger;
    /**
     * Manual logging methods
     */
    info(message: string, meta?: any): void;
    warn(message: string, meta?: any): void;
    error(message: string, meta?: any): void;
    debug(message: string, meta?: any): void;
}
declare global {
    namespace Express {
        interface Request {
            requestId?: string;
        }
    }
}
export declare const createSecurityLogger: (config: SecurityLogConfig) => SecurityLogger;
export declare const defaultLogConfig: SecurityLogConfig;
//# sourceMappingURL=logging.d.ts.map