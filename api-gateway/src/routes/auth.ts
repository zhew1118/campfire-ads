import { Router, Request, Response } from 'express';

const router = Router();

// Mock user database for development (matches CLAUDE.md test credentials)
const mockUsers = [
  {
    id: 'test-user',
    email: 'test@example.com',
    password: 'password123', // In production, this would be properly hashed
    role: 'podcaster' as const
  },
  {
    id: 'advertiser-user', 
    email: 'advertiser@example.com',
    password: 'password123',
    role: 'advertiser' as const
  }
];

/**
 * POST /login
 * Authenticate user and return JWT token using existing auth middleware
 * This endpoint will be accessible at /api/auth/login
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password, role } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required',
        code: 'MISSING_CREDENTIALS'
      });
    }

    // Find user in mock database
    const user = mockUsers.find(u => 
      u.email === email && 
      u.password === password &&
      (!role || u.role === role) // Role is optional, but if provided must match
    );

    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Use the common auth middleware's generateToken method
    // Note: This requires access to the auth middleware instance from app-secure.ts
    // For now, we'll create a local instance with the same config
    const { createAuthMiddleware } = require('../../../common/middleware');
    const jwtSecret = process.env.JWT_SECRET || 'development-jwt-secret-key';
    const authMiddleware = createAuthMiddleware({ secret: jwtSecret });

    const token = authMiddleware.generateToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    // Return response in format expected by dashboard
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'SERVER_ERROR'
    });
  }
});

export default router;