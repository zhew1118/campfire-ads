import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import { createAuthMiddleware, createSecurityLogger, defaultLogConfig, errorHandler, notFoundHandler } from '../../../common/middleware';
import { trackingRouter } from './routes/tracking';
import { placementsRouter } from './routes/placements';
import { hostReportsRouter } from './routes/hostReports';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3006;

const authMiddleware = createAuthMiddleware({
  secret: process.env.JWT_SECRET || 'development-jwt-secret-key'
});

const securityLogger = createSecurityLogger({
  ...defaultLogConfig,
  logDirectory: './logs'
});

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10000,
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(helmet());
app.use(cors());
app.use(compression());
app.use(limiter);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(securityLogger.requestLogger());
app.use(securityLogger.securityEventLogger());

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'tracking-service',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Public tracking endpoints (no auth required)
app.use('/', trackingRouter);

// JWT-protected API endpoints
app.use('/api/placements', authMiddleware.validateJWT, placementsRouter);
app.use('/api/host-reports', authMiddleware.validateJWT, hostReportsRouter);

app.use(notFoundHandler);
app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Tracking service running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
  });
}

export default app;

