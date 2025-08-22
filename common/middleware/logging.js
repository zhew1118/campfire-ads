"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultLogConfig = exports.createSecurityLogger = exports.SecurityLogger = void 0;
const winston_1 = __importDefault(require("winston"));
class SecurityLogger {
    logger;
    config;
    constructor(config) {
        this.config = {
            level: config.level || 'info',
            logDirectory: config.logDirectory || './logs',
            enableConsole: config.enableConsole !== false,
            enableFile: config.enableFile !== false,
            maxFiles: config.maxFiles || 14, // 2 weeks of daily logs
            maxSize: config.maxSize || '100m',
            includeRequestBody: config.includeRequestBody || false,
            includeResponseBody: config.includeResponseBody || false,
            sensitiveFields: config.sensitiveFields || [
                'password', 'token', 'authorization', 'x-api-key', 'secret',
                'ssn', 'credit_card', 'bank_account', 'api_key'
            ],
            logRotation: config.logRotation !== false
        };
        this.logger = this.createLogger();
    }
    createLogger() {
        const transports = [];
        // Console transport
        if (this.config.enableConsole) {
            transports.push(new winston_1.default.transports.Console({
                level: this.config.level,
                format: winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.timestamp(), winston_1.default.format.errors({ stack: true }), winston_1.default.format.printf(({ timestamp, level, message, ...meta }) => {
                    return `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`;
                }))
            }));
        }
        // File transports
        if (this.config.enableFile) {
            // General application logs
            transports.push(new winston_1.default.transports.File({
                filename: `${this.config.logDirectory}/application.log`,
                level: this.config.level,
                maxsize: parseInt(this.config.maxSize) * 1024 * 1024,
                maxFiles: this.config.maxFiles,
                tailable: true
            }));
            // Security-specific logs
            transports.push(new winston_1.default.transports.File({
                filename: `${this.config.logDirectory}/security.log`,
                level: 'warn',
                maxsize: parseInt(this.config.maxSize) * 1024 * 1024,
                maxFiles: this.config.maxFiles,
                tailable: true
            }));
            // Error logs
            transports.push(new winston_1.default.transports.File({
                filename: `${this.config.logDirectory}/error.log`,
                level: 'error',
                maxsize: parseInt(this.config.maxSize) * 1024 * 1024,
                maxFiles: this.config.maxFiles,
                tailable: true
            }));
            // RTB performance logs (separate for analysis)
            transports.push(new winston_1.default.transports.File({
                filename: `${this.config.logDirectory}/rtb-performance.log`,
                level: 'info',
                maxsize: parseInt(this.config.maxSize) * 1024 * 1024,
                maxFiles: this.config.maxFiles,
                tailable: true,
                format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.json())
            }));
        }
        return winston_1.default.createLogger({
            level: this.config.level,
            format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json()),
            transports,
            exceptionHandlers: [
                new winston_1.default.transports.File({ filename: `${this.config.logDirectory}/exceptions.log` })
            ],
            rejectionHandlers: [
                new winston_1.default.transports.File({ filename: `${this.config.logDirectory}/rejections.log` })
            ]
        });
    }
    /**
     * Request/Response logging middleware
     */
    requestLogger = () => {
        return (req, res, next) => {
            const startTime = Date.now();
            const requestId = this.generateRequestId();
            // Add request ID to request for tracing
            req.requestId = requestId;
            const logContext = {
                requestId,
                userId: req.user?.id,
                userRole: req.user?.role,
                ip: this.getClientIP(req),
                userAgent: req.get('User-Agent') || '',
                method: req.method,
                url: req.originalUrl || req.url,
                timestamp: new Date().toISOString()
            };
            // Log request
            this.logRequest(req, logContext);
            // Capture original end function
            const originalEnd = res.end;
            // Override response end to log response
            res.end = (...args) => {
                logContext.duration = Date.now() - startTime;
                logContext.statusCode = res.statusCode;
                this.logResponse(req, res, logContext);
                // Call original end function
                originalEnd.apply(res, args);
            };
            next();
        };
    };
    /**
     * Security event logging middleware
     */
    securityEventLogger = () => {
        return (req, res, next) => {
            // Override original end to detect security events
            const originalEnd = res.end;
            res.end = (...args) => {
                // Log security events based on status codes
                if (res.statusCode === 401) {
                    this.logSecurityEvent('AUTHENTICATION_FAILURE', req, {
                        reason: 'Invalid or missing credentials',
                        statusCode: res.statusCode
                    });
                }
                else if (res.statusCode === 403) {
                    this.logSecurityEvent('AUTHORIZATION_FAILURE', req, {
                        reason: 'Insufficient permissions',
                        statusCode: res.statusCode,
                        userId: req.user?.id,
                        userRole: req.user?.role
                    });
                }
                else if (res.statusCode === 429) {
                    this.logSecurityEvent('RATE_LIMIT_EXCEEDED', req, {
                        reason: 'Too many requests',
                        statusCode: res.statusCode
                    });
                }
                originalEnd.apply(res, args);
            };
            next();
        };
    };
    /**
     * RTB performance logging middleware
     */
    rtbLogger = () => {
        return (req, res, next) => {
            if (!req.path.includes('/rtb') && !req.path.includes('/ads/bid')) {
                return next();
            }
            const startTime = process.hrtime.bigint();
            const originalEnd = res.end;
            res.end = (...args) => {
                const endTime = process.hrtime.bigint();
                const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds
                this.logger.info('RTB Performance', {
                    type: 'RTB_PERFORMANCE',
                    method: req.method,
                    path: req.path,
                    statusCode: res.statusCode,
                    duration: `${duration.toFixed(2)}ms`,
                    ip: this.getClientIP(req),
                    timestamp: new Date().toISOString(),
                    isSlowRequest: duration > 10, // Flag requests over 10ms
                    requestSize: req.get('content-length') || 0,
                    responseSize: res.get('content-length') || 0
                });
                // Alert on slow RTB requests
                if (duration > 10) {
                    this.logSecurityEvent('RTB_SLOW_RESPONSE', req, {
                        duration: `${duration.toFixed(2)}ms`,
                        threshold: '10ms',
                        statusCode: res.statusCode
                    });
                }
                originalEnd.apply(res, args);
            };
            next();
        };
    };
    logRequest(req, context) {
        const logData = {
            type: 'REQUEST',
            ...context
        };
        if (this.config.includeRequestBody && req.body) {
            logData.requestBody = this.sanitizeData(req.body);
        }
        if (req.query && Object.keys(req.query).length > 0) {
            logData.queryParams = this.sanitizeData(req.query);
        }
        this.logger.info('Request', logData);
    }
    logResponse(req, res, context) {
        const logData = {
            type: 'RESPONSE',
            ...context
        };
        // Log response body for errors or if explicitly enabled
        if (this.config.includeResponseBody && (res.statusCode >= 400 || this.config.includeResponseBody)) {
            // Note: Response body logging would require additional setup to capture the body
            logData.note = 'Response body logging requires additional middleware setup';
        }
        const logLevel = res.statusCode >= 400 ? 'error' : 'info';
        this.logger.log(logLevel, 'Response', logData);
    }
    /**
     * Log security events
     */
    logSecurityEvent(eventType, req, metadata = {}) {
        const logData = {
            type: 'SECURITY_EVENT',
            eventType,
            ip: this.getClientIP(req),
            userAgent: req.get('User-Agent'),
            method: req.method,
            url: req.originalUrl || req.url,
            timestamp: new Date().toISOString(),
            ...metadata
        };
        this.logger.warn('Security Event', logData);
    }
    /**
     * Log authentication events
     */
    logAuthEvent(eventType, userId, req, metadata = {}) {
        const logData = {
            type: 'AUTH_EVENT',
            eventType,
            userId,
            ip: this.getClientIP(req),
            userAgent: req.get('User-Agent'),
            timestamp: new Date().toISOString(),
            ...metadata
        };
        this.logger.info('Authentication Event', logData);
    }
    /**
     * Log business events
     */
    logBusinessEvent(eventType, data) {
        const logData = {
            type: 'BUSINESS_EVENT',
            eventType,
            timestamp: new Date().toISOString(),
            ...this.sanitizeData(data)
        };
        this.logger.info('Business Event', logData);
    }
    sanitizeData(data) {
        if (!data || typeof data !== 'object') {
            return data;
        }
        const sanitized = { ...data };
        this.config.sensitiveFields.forEach(field => {
            if (sanitized[field]) {
                sanitized[field] = '***REDACTED***';
            }
        });
        return sanitized;
    }
    getClientIP(req) {
        return req.headers['x-forwarded-for']?.split(',')[0] ||
            req.headers['x-real-ip'] ||
            req.connection?.remoteAddress ||
            req.socket?.remoteAddress ||
            'unknown';
    }
    generateRequestId() {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Get the underlying Winston logger
     */
    getLogger() {
        return this.logger;
    }
    /**
     * Manual logging methods
     */
    info(message, meta) {
        this.logger.info(message, meta);
    }
    warn(message, meta) {
        this.logger.warn(message, meta);
    }
    error(message, meta) {
        this.logger.error(message, meta);
    }
    debug(message, meta) {
        this.logger.debug(message, meta);
    }
}
exports.SecurityLogger = SecurityLogger;
// Export factory function
const createSecurityLogger = (config) => new SecurityLogger(config);
exports.createSecurityLogger = createSecurityLogger;
// Export default configuration
exports.defaultLogConfig = {
    level: process.env.LOG_LEVEL || 'info',
    logDirectory: process.env.LOG_DIR || './logs',
    enableConsole: process.env.NODE_ENV !== 'production',
    enableFile: true,
    maxFiles: 14,
    maxSize: '100m',
    includeRequestBody: process.env.LOG_INCLUDE_REQUEST_BODY === 'true',
    includeResponseBody: false,
    sensitiveFields: [
        'password', 'token', 'authorization', 'x-api-key', 'secret',
        'ssn', 'credit_card', 'bank_account', 'api_key', 'refresh_token'
    ],
    logRotation: true
};
//# sourceMappingURL=logging.js.map