import { Router, Request, Response, NextFunction } from 'express';
import { TrackingService } from '../services/TrackingService';

export const trackingRouter = Router();
const trackingService = new TrackingService();

// Helper to parse Range header
function parseRange(rangeHeader: string, fileSize?: number): { start: number; end: number } | null {
  const match = rangeHeader.match(/bytes=(\d+)-(\d*)/);
  if (!match) return null;
  
  const start = parseInt(match[1]);
  const end = match[2] ? parseInt(match[2]) : (fileSize ? fileSize - 1 : undefined);
  
  return { start, end: end || start + 1048576 }; // Default to 1MB if no end
}

// GET /i/:trackingKey.mp3 → log and 302 to creative (IAB-compliant)
trackingRouter.get('/i/:trackingKey.mp3', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { trackingKey } = req.params;
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || '';
    const method = req.method;
    const referrer = req.get('Referer');
    const rangeHeader = req.get('Range');
    
    // Parse Range header for partial content requests
    let rangeStart, rangeEnd, bytesSent;
    if (rangeHeader) {
      const range = parseRange(rangeHeader);
      if (range) {
        rangeStart = range.start;
        rangeEnd = range.end;
        bytesSent = range.end - range.start + 1;
      }
    }

    // Log impression with IAB-compliant data
    await trackingService.logEvent({
      trackingKey,
      isPrefix: false,
      ip,
      userAgent,
      method,
      rangeStart,
      rangeEnd,
      bytesSent,
      referrer,
      status: 302 // Will be 302 redirect
    });

    // Resolve creative destination
    const destination = await trackingService.resolveCreativeURL(trackingKey);
    if (!destination) {
      return res.status(404).json({ error: 'Invalid tracking key' });
    }

    // Handle Range requests with proper headers
    if (rangeHeader && rangeStart !== undefined) {
      res.status(206); // Partial Content
      res.set('Accept-Ranges', 'bytes');
      if (rangeEnd !== undefined) {
        res.set('Content-Range', `bytes ${rangeStart}-${rangeEnd}/*`);
      }
    }

    return res.redirect(rangeHeader ? 206 : 302, destination);
  } catch (err) {
    next(err);
  }
});

// Legacy route without .mp3 extension
trackingRouter.get('/i/:trackingKey', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { trackingKey } = req.params;
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || '';
    const referrer = req.get('Referer');

    // Log basic impression
    await trackingService.logEvent({
      trackingKey,
      isPrefix: false,
      ip,
      userAgent,
      method: req.method,
      referrer,
      status: 302
    });

    // Resolve creative destination
    const destination = await trackingService.resolveCreativeURL(trackingKey);
    if (!destination) {
      return res.status(404).json({ error: 'Invalid tracking key' });
    }

    return res.redirect(302, destination);
  } catch (err) {
    next(err);
  }
});

// GET /prefix?url=... → log and 302 to original episode URL
trackingRouter.get('/prefix', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const url = (req.query.url as string) || '';
    if (!url) {
      return res.status(400).json({ error: 'Missing url parameter' });
    }

    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || '';
    const referrer = req.get('Referer');
    
    await trackingService.logEvent({
      trackingKey: url, // use URL as key surrogate for now
      isPrefix: true,
      ip,
      userAgent,
      method: req.method,
      referrer,
      status: 302
    });

    return res.redirect(302, url);
  } catch (err) {
    next(err);
  }
});

// Health endpoint specifically for tracking service
trackingRouter.get('/tracking/health', (req: Request, res: Response) => {
  res.json({
    service: 'tracking-service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    endpoints: {
      impression_tracking: '/i/{trackingKey}.mp3',
      prefix_tracking: '/prefix?url={episodeUrl}',
      placements: '/api/placements',
      host_reports: '/api/host-reports'
    }
  });
});

