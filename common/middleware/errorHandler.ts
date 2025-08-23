import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode: number;
  status?: string;
  isOperational?: boolean;
  code?: string;
  details?: any;
}

export class APIError extends Error implements AppError {
  public statusCode: number;
  public status: string;
  public isOperational: boolean;
  public code: string;
  public details?: any;

  constructor(message: string, statusCode: number = 500, code?: string, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.status = statusCode >= 400 && statusCode < 500 ? 'fail' : 'error';
    this.isOperational = true;
    this.code = code || 'GENERAL_ERROR';
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Common error types
export class ValidationError extends APIError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class AuthenticationError extends APIError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

export class AuthorizationError extends APIError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

export class NotFoundError extends APIError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class ConflictError extends APIError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409, 'CONFLICT_ERROR');
  }
}

export class RateLimitError extends APIError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT_ERROR');
  }
}

export class DatabaseError extends APIError {
  constructor(message: string, code?: string, details?: any) {
    super(message, 500, code || 'DATABASE_ERROR', details);
  }
}

export const errorHandler = (
  err: AppError | any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error = err;

  // Handle non-APIError instances
  if (!(err instanceof APIError)) {
    // PostgreSQL specific errors
    if (err.code) {
      switch (err.code) {
        case '23505': // unique_violation
          error = new ConflictError('Resource already exists');
          break;
        case '23503': // foreign_key_violation
          error = new ValidationError('Referenced resource does not exist');
          break;
        case '23502': // not_null_violation
          error = new ValidationError('Required field is missing');
          break;
        case '22001': // string_data_right_truncation
          error = new ValidationError('Data too long for field');
          break;
        default:
          error = new DatabaseError('Database operation failed', err.code);
      }
    }
    // JWT errors
    else if (err.name === 'TokenExpiredError') {
      error = new AuthenticationError('Token expired');
    }
    else if (err.name === 'JsonWebTokenError') {
      error = new AuthenticationError('Invalid token');
    }
    // Joi validation errors
    else if (err.name === 'ValidationError' && err.details) {
      error = new ValidationError('Validation failed', err.details);
    }
    // Generic errors
    else {
      error = new APIError(
        err.message || 'Internal server error',
        err.statusCode || 500,
        err.code || 'INTERNAL_ERROR'
      );
    }
  }

  const errorResponse: any = {
    status: error.status || 'error',
    error: {
      message: error.message,
      code: error.code,
      timestamp: new Date().toISOString(),
      path: req.originalUrl || req.url,
      method: req.method
    }
  };

  // Include error details if available
  if (error.details) {
    errorResponse.error.details = error.details;
  }

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error.stack = error.stack;
  }

  // Log error (will be caught by logging middleware if present)
  console.error('Error occurred:', {
    message: error.message,
    statusCode: error.statusCode,
    code: error.code,
    path: req.originalUrl || req.url,
    method: req.method,
    userId: (req as any).user?.id,
    stack: error.stack,
    timestamp: new Date().toISOString()
  });

  res.status(error.statusCode || 500).json(errorResponse);
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 404 handler
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = new NotFoundError(`Route ${req.originalUrl} not found`);
  next(error);
};