import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

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

export class AuthMiddleware {
  private jwtConfig: JWTConfig;

  constructor(config: JWTConfig) {
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
  validateJWT = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
          error: 'Authentication required',
          code: 'NO_TOKEN'
        });
      }
      
      const token = authHeader.substring(7);
      
      const decoded = jwt.verify(token, this.jwtConfig.secret, {
        issuer: this.jwtConfig.issuer,
        audience: this.jwtConfig.audience
      }) as any;
      
      req.user = {
        id: decoded.id || decoded.sub,
        email: decoded.email,
        role: decoded.role || 'podcaster',
        iat: decoded.iat,
        exp: decoded.exp
      };
      
      next();
    } catch (error: any) {
      let errorMessage = 'Invalid token';
      let errorCode = 'INVALID_TOKEN';
      
      if (error.name === 'TokenExpiredError') {
        errorMessage = 'Token expired';
        errorCode = 'TOKEN_EXPIRED';
      } else if (error.name === 'JsonWebTokenError') {
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
  validateAPIKey = (validKeys: string[] | string) => {
    const keys = Array.isArray(validKeys) ? validKeys : [validKeys];
    
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      const apiKey = req.headers['x-api-key'] as string;
      
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
  requireRole = (allowedRoles: string | string[]) => {
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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
  requireOwnership = (getResourceUserId: (req: AuthenticatedRequest) => string | Promise<string>) => {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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
      } catch (error) {
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
  generateToken(payload: object): string {
    if (!this.jwtConfig.secret) {
      throw new Error('JWT secret is required');
    }
    
    const options: any = {
      expiresIn: this.jwtConfig.expiresIn || '24h',
      issuer: this.jwtConfig.issuer || 'campfire-ads',
      audience: this.jwtConfig.audience || 'campfire-ads-api'
    };
    
    return jwt.sign(payload, this.jwtConfig.secret, options);
  }

  /**
   * Verify and decode JWT token without middleware
   */
  verifyToken(token: string): any {
    return jwt.verify(token, this.jwtConfig.secret, {
      issuer: this.jwtConfig.issuer,
      audience: this.jwtConfig.audience
    });
  }
}

// Export a default instance for backward compatibility
export const createAuthMiddleware = (config: JWTConfig) => new AuthMiddleware(config);