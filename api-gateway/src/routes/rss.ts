import { Router, Response, Request } from 'express';
import { HTTPClient } from '../services/httpClient';

const router = Router();
const rssService = new HTTPClient('rss');

router.get('/:podcastId', async (req: Request, res: Response) => {
  try {
    const response = await rssService.get(`/${req.params.podcastId}`, {
      params: req.query
    });
    
    res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.send(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || 'Failed to generate RSS feed'
    });
  }
});

router.get('/:podcastId/preview', async (req: Request, res: Response) => {
  try {
    const response = await rssService.get(`/${req.params.podcastId}/preview`, {
      params: req.query
    });
    
    res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8');
    res.send(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || 'Failed to generate preview feed'
    });
  }
});

router.post('/:podcastId/refresh', async (req: Request, res: Response) => {
  try {
    const response = await rssService.post(`/${req.params.podcastId}/refresh`, {
      force: req.body.force || false
    });
    
    res.json({
      status: 'refreshed',
      updated_at: response.data.updated_at,
      cache_expires: response.data.cache_expires
    });
  } catch (error: any) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || 'Failed to refresh feed cache'
    });
  }
});

router.get('/:podcastId/stats', async (req: Request, res: Response) => {
  try {
    const analyticsService = new HTTPClient('analytics');
    const response = await analyticsService.get(`/reports/rss/${req.params.podcastId}`, {
      params: req.query
    });
    
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || 'Failed to fetch feed statistics'
    });
  }
});

export default router;