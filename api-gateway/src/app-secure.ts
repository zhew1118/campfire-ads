import express from 'express';
import compression from 'compression';
import dotenv from 'dotenv';

// Import centralized security middleware
import {
  createAuthMiddleware,
  createRateLimiter,
  createValidator,
  createSecurityLogger,
  createSecurityMiddleware,
  commonLimits,
  defaultLogConfig,
  defaultSecurityConfig,
  errorHandler,
  notFoundHandler
} from '../../common/middleware';

import authRouter from './routes/auth';
import podcastersRouter from './routes/podcasters';
import advertisersRouter from './routes/advertisers';
import campaignsRouter from './routes/campaigns';
import inventoryRouter from './routes/inventory';
import podcastsRouter from './routes/podcasts';
import episodesRouter from './routes/episodes';
import slotsRouter from './routes/slots';
import adsRouter from './routes/ads';
import analyticsRouter from './routes/analytics';
import audioRouter from './routes/audio';
import rssRouter from './routes/rss';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize security components
const jwtSecret = process.env.JWT_SECRET || 'development-jwt-secret-key';
const authMiddleware = createAuthMiddleware({ secret: jwtSecret });

const securityLogger = createSecurityLogger(defaultLogConfig);
const securityMiddleware = createSecurityMiddleware(defaultSecurityConfig);

// Create different rate limiters for different use cases
const generalRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 1000,
  redisUrl: process.env.REDIS_URL
});

const rtbRateLimiter = createRateLimiter({
  windowMs: 1000, // 1 second
  maxRequests: 100,
  redisUrl: process.env.REDIS_URL
});

const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10,
  redisUrl: process.env.REDIS_URL
});

// Validation middleware
const validator = createValidator();

// Apply security middleware in order of priority
app.use(securityMiddleware.securityHeaders());
app.use(securityMiddleware.corsMiddleware());
app.use(securityMiddleware.customHeaders());
app.use(securityMiddleware.sanitizeInput());
app.use(securityMiddleware.securityMonitoring());

// Request parsing
app.use(compression());
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    // Verify JSON payload integrity
    try {
      JSON.parse(buf.toString());
    } catch (e) {
      throw new Error('Invalid JSON payload');
    }
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use(securityLogger.requestLogger());
app.use(securityLogger.securityEventLogger());

// General rate limiting
app.use(generalRateLimiter.middleware());

// RTB-specific ultra-fast rate limiting for bid endpoints
app.use('/api/ads/bid', rtbRateLimiter.rtbMiddleware(10000)); // 10k req/s max
app.use('/api/ads/bid', securityLogger.rtbLogger());

// Auth rate limiting for sensitive endpoints
app.use('/api/auth/*', authRateLimiter.middleware());

// Health check endpoint (bypass most security for monitoring)
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    security: {
      middleware: 'enabled',
      rateLimit: 'active',
      logging: 'active'
    }
  });
});

// Authentication routes (public endpoints for login)
app.use('/api/auth', authRouter);

// API routes with appropriate middleware
app.use('/api/podcasters', 
  authMiddleware.validateJWT,
  podcastersRouter
);

app.use('/api/advertisers', 
  authMiddleware.validateJWT,
  advertisersRouter
);

app.use('/api/campaigns', 
  authMiddleware.validateJWT,
  campaignsRouter
);

app.use('/api/inventory', 
  authMiddleware.validateJWT,
  inventoryRouter
);

app.use('/api/podcasts', 
  authMiddleware.validateJWT,
  podcastsRouter
);

app.use('/api/episodes', 
  authMiddleware.validateJWT,
  episodesRouter
);

app.use('/api/slots', 
  authMiddleware.validateJWT,
  slotsRouter
);

// RTB endpoints use API key authentication
app.use('/api/ads', 
  authMiddleware.validateAPIKey(process.env.API_KEY || 'development-api-key'),
  adsRouter
);

// Analytics endpoints (public for tracking pixels, but with validation)
app.use('/api/analytics', analyticsRouter);

// Audio processing requires authentication
app.use('/api/audio', 
  authMiddleware.validateJWT,
  audioRouter
);

// RSS endpoints are public but rate limited
app.use('/api/rss', rssRouter);

// Enhanced 404 handler with security logging
app.use('*', (req, res, next) => {
  securityLogger.logSecurityEvent('ROUTE_NOT_FOUND', req, {
    attempted_path: req.originalUrl,
    method: req.method
  });
  next(); // Let the common notFoundHandler handle the actual response
});

app.use(notFoundHandler);

// Enhanced error handler with security logging
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Log security-related errors
  if (err.statusCode >= 400) {
    securityLogger.logSecurityEvent('APPLICATION_ERROR', req, {
      error: err.message,
      statusCode: err.statusCode,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }

  // Use common error handler
  errorHandler(err, req, res, next);
});

// Graceful shutdown handling
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  
  // Close rate limiter connections
  await generalRateLimiter.close();
  await rtbRateLimiter.close();
  await authRateLimiter.close();
  
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  
  // Close rate limiter connections
  await generalRateLimiter.close();
  await rtbRateLimiter.close();
  await authRateLimiter.close();
  
  process.exit(0);
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 Secure API Gateway running on port ${PORT}`);
    console.log(`🔒 Security middleware: ENABLED`);
    console.log(`📊 Rate limiting: ACTIVE`);
    console.log(`📝 Security logging: ACTIVE`);
    console.log(`🩺 Health check: http://localhost:${PORT}/health`);
    
    // Log startup event
    securityLogger.logBusinessEvent('SERVICE_STARTUP', {
      service: 'api-gateway',
      port: PORT,
      environment: process.env.NODE_ENV || 'development',
      security_enabled: true
    });
  });
}

export default app;