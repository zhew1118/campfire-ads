import { Router, Request, Response } from 'express';
import { query } from '../../../common/middleware';

const router = Router();

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

    // Query user from database
    const result = await query(`
      SELECT id, email, role, first_name, last_name, company_name
      FROM users 
      WHERE email = $1 AND ($2::text IS NULL OR role = $2)
    `, [email, role || null]);

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }

    const user = result.rows[0];
    
    // For development, accept password123 for all users
    // In production, verify against password_hash field
    if (password !== 'password123') {
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