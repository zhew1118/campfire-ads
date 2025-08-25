import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createAuthMiddleware, createSecurityLogger, defaultLogConfig, errorHandler, notFoundHandler } from '../../../common/middleware';
import { inventoryRoutes } from './routes/inventory';
import { campaignRoutes } from './routes/campaigns';
import { podcasterRoutes } from './routes/podcasters';
import { podcastRoutes } from './routes/podcasts';
import { episodeRoutes } from './routes/episodes';
import { adSlotRoutes } from './routes/slots';
import { reservationRoutes } from './routes/reservations';

dotenv.config();

const app = express();
const port = process.env.PORT || 3004;

// Create middleware instances
const authMiddleware = createAuthMiddleware({
  secret: process.env.JWT_SECRET || 'development-jwt-secret-key'
});

const securityLogger = createSecurityLogger({
  ...defaultLogConfig,
  logDirectory: './logs'
});

const logger = securityLogger.getLogger();

// Basic middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3001', 'http://localhost:3000'],
  credentials: true
}));

// Security logging middleware
app.use(securityLogger.requestLogger());
app.use(securityLogger.securityEventLogger());

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'inventory-service',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API routes - matches what API Gateway expects
app.use('/inventory', inventoryRoutes); // Browse available ad slots (mixed public/private)
app.use('/campaigns', authMiddleware.validateJWT, campaignRoutes); // Campaign management backend - JWT required
app.use('/podcasters', podcasterRoutes); // Podcaster management backend - mixed auth
app.use('/podcasts', authMiddleware.validateJWT, podcastRoutes); // Podcast management backend - JWT required
app.use('/episodes', authMiddleware.validateJWT, episodeRoutes); // Episode management backend - JWT required
app.use('/slots', authMiddleware.validateJWT, adSlotRoutes); // Ad slot management backend - JWT required
app.use('/reservations', reservationRoutes); // RTB reservation system - mixed auth (some endpoints public)

// 404 handler
app.use(notFoundHandler);

// Error handling middleware
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server
app.listen(port, () => {
  logger.info(`Inventory service running on port ${port}`);
  logger.info(`Health check available at http://localhost:${port}/health`);
});

export default app;