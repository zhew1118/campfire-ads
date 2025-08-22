import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { authMiddleware } from './middleware/auth';

import podcastersRouter from './routes/podcasters';
import advertisersRouter from './routes/advertisers';
import campaignsRouter from './routes/campaigns';
import inventoryRouter from './routes/inventory';
import adsRouter from './routes/ads';
import analyticsRouter from './routes/analytics';
import audioRouter from './routes/audio';
import rssRouter from './routes/rss';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(helmet());
app.use(cors());
app.use(compression());
app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

app.use('/api/podcasters', authMiddleware, podcastersRouter);
app.use('/api/advertisers', authMiddleware, advertisersRouter);
app.use('/api/campaigns', authMiddleware, campaignsRouter);
app.use('/api/inventory', authMiddleware, inventoryRouter);
app.use('/api/ads', adsRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/audio', authMiddleware, audioRouter);
app.use('/api/rss', rssRouter);

app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`API Gateway running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
  });
}

export default app;