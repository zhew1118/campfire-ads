import { Request, Response, NextFunction } from 'express';
export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: 'podcaster' | 'advertiser' | 'admin';
        iat?: number;
        exp?: number;
    };
    apiKey?: string;
}
export interface JWTConfig {
    secret: string;
    expiresIn?: string;
    issuer?: string;
    audience?: string;
}
export declare class AuthMiddleware {
    private jwtConfig;
    constructor(config: JWTConfig);
    /**
     * JWT Authentication middleware
     * Validates Bearer tokens and populates req.user
     */
    validateJWT: (req: AuthenticatedRequest, res: Response, next: NextFunction) => any;
    /**
     * API Key validation for service-to-service communication
     */
    validateAPIKey: (validKeys: string[] | string) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => any;
    /**
     * Role-based access control
     */
    requireRole: (allowedRoles: string | string[]) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => any;
    /**
     * Resource ownership validation
     */
    requireOwnership: (getResourceUserId: (req: AuthenticatedRequest) => string | Promise<string>) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<any>;
    /**
     * Generate JWT token
     */
    generateToken(payload: object): string;
    /**
     * Verify and decode JWT token without middleware
     */
    verifyToken(token: string): any;
}
export declare const createAuthMiddleware: (config: JWTConfig) => AuthMiddleware;
//# sourceMappingURL=auth.d.ts.map