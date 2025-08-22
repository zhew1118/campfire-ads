"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAuthMiddleware = exports.AuthMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
class AuthMiddleware {
    jwtConfig;
    constructor(config) {
        this.jwtConfig = {
            expiresIn: '24h',
            issuer: 'campfire-ads',
            audience: 'campfire-ads-api',
            ...config
        };
    }
    /**
     * JWT Authentication middleware
     * Validates Bearer tokens and populates req.user
     */
    validateJWT = (req, res, next) => {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({
                    error: 'Authentication required',
                    code: 'NO_TOKEN'
                });
            }
            const token = authHeader.substring(7);
            const decoded = jsonwebtoken_1.default.verify(token, this.jwtConfig.secret, {
                issuer: this.jwtConfig.issuer,
                audience: this.jwtConfig.audience
            });
            req.user = {
                id: decoded.id || decoded.sub,
                email: decoded.email,
                role: decoded.role || 'podcaster',
                iat: decoded.iat,
                exp: decoded.exp
            };
            next();
        }
        catch (error) {
            let errorMessage = 'Invalid token';
            let errorCode = 'INVALID_TOKEN';
            if (error.name === 'TokenExpiredError') {
                errorMessage = 'Token expired';
                errorCode = 'TOKEN_EXPIRED';
            }
            else if (error.name === 'JsonWebTokenError') {
                errorMessage = 'Malformed token';
                errorCode = 'MALFORMED_TOKEN';
            }
            return res.status(401).json({
                error: errorMessage,
                code: errorCode
            });
        }
    };
    /**
     * API Key validation for service-to-service communication
     */
    validateAPIKey = (validKeys) => {
        const keys = Array.isArray(validKeys) ? validKeys : [validKeys];
        return (req, res, next) => {
            const apiKey = req.headers['x-api-key'];
            if (!apiKey) {
                return res.status(401).json({
                    error: 'API key required',
                    code: 'NO_API_KEY'
                });
            }
            if (!keys.includes(apiKey)) {
                return res.status(401).json({
                    error: 'Invalid API key',
                    code: 'INVALID_API_KEY'
                });
            }
            req.apiKey = apiKey;
            next();
        };
    };
    /**
     * Role-based access control
     */
    requireRole = (allowedRoles) => {
        const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
        return (req, res, next) => {
            if (!req.user) {
                return res.status(401).json({
                    error: 'Authentication required',
                    code: 'NOT_AUTHENTICATED'
                });
            }
            if (!roles.includes(req.user.role)) {
                return res.status(403).json({
                    error: 'Insufficient permissions',
                    code: 'INSUFFICIENT_PERMISSIONS',
                    required: roles,
                    current: req.user.role
                });
            }
            next();
        };
    };
    /**
     * Resource ownership validation
     */
    requireOwnership = (getResourceUserId) => {
        return async (req, res, next) => {
            try {
                if (!req.user) {
                    return res.status(401).json({
                        error: 'Authentication required',
                        code: 'NOT_AUTHENTICATED'
                    });
                }
                // Admin can access all resources
                if (req.user.role === 'admin') {
                    return next();
                }
                const resourceUserId = await getResourceUserId(req);
                if (resourceUserId !== req.user.id) {
                    return res.status(403).json({
                        error: 'Access denied to this resource',
                        code: 'RESOURCE_ACCESS_DENIED'
                    });
                }
                next();
            }
            catch (error) {
                return res.status(500).json({
                    error: 'Error validating resource ownership',
                    code: 'OWNERSHIP_CHECK_ERROR'
                });
            }
        };
    };
    /**
     * Generate JWT token
     */
    generateToken(payload) {
        return jsonwebtoken_1.default.sign(payload, this.jwtConfig.secret, {
            expiresIn: this.jwtConfig.expiresIn,
            issuer: this.jwtConfig.issuer,
            audience: this.jwtConfig.audience
        });
    }
    /**
     * Verify and decode JWT token without middleware
     */
    verifyToken(token) {
        return jsonwebtoken_1.default.verify(token, this.jwtConfig.secret, {
            issuer: this.jwtConfig.issuer,
            audience: this.jwtConfig.audience
        });
    }
}
exports.AuthMiddleware = AuthMiddleware;
// Export a default instance for backward compatibility
const createAuthMiddleware = (config) => new AuthMiddleware(config);
exports.createAuthMiddleware = createAuthMiddleware;
//# sourceMappingURL=auth.js.map