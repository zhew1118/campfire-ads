import { Router, Response, Request } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { HTTPClient } from '../services/httpClient';

const router = Router();
const analyticsService = new HTTPClient('analytics');

router.post('/events', async (req: Request, res: Response) => {
  try {
    const eventData = {
      ...req.body,
      timestamp: req.body.timestamp || new Date().toISOString(),
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    };
    
    const response = await analyticsService.post('/events', eventData);
    res.status(201).json({ status: 'tracked', event_id: response.data.id });
  } catch (error: any) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || 'Failed to track event'
    });
  }
});

router.post('/events/batch', async (req: Request, res: Response) => {
  try {
    const events = req.body.events.map((event: any) => ({
      ...event,
      timestamp: event.timestamp || new Date().toISOString(),
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    }));
    
    const response = await analyticsService.post('/events/batch', { events });
    res.status(201).json({ 
      status: 'tracked', 
      processed: response.data.processed,
      failed: response.data.failed 
    });
  } catch (error: any) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || 'Failed to track batch events'
    });
  }
});

router.get('/reports', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const queryParams = {
      ...req.query,
      user_id: req.user?.id,
      user_role: req.user?.role
    };
    
    const response = await analyticsService.get('/reports', {
      params: queryParams
    });
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || 'Failed to fetch reports'
    });
  }
});

router.get('/reports/campaign/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const response = await analyticsService.get(`/reports/campaign/${req.params.id}`, {
      params: req.query
    });
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || 'Failed to fetch campaign report'
    });
  }
});

router.get('/reports/podcaster/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const response = await analyticsService.get(`/reports/podcaster/${req.params.id}`, {
      params: req.query
    });
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || 'Failed to fetch podcaster report'
    });
  }
});

router.get('/reports/advertiser/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const response = await analyticsService.get(`/reports/advertiser/${req.params.id}`, {
      params: req.query
    });
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || 'Failed to fetch advertiser report'
    });
  }
});

export default router;