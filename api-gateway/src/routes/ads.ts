import { Router, Response, Request } from 'express';
import { HTTPClient } from '../services/httpClient';
import { validateAPIKey } from '../middleware/auth';

const router = Router();
const rtbService = new HTTPClient('rtb');

router.post('/bid', validateAPIKey, async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();
    
    const response = await rtbService.post('/bid', req.body, {
      timeout: 50
    });
    
    const latency = Date.now() - startTime;
    console.log(`RTB bid processed in ${latency}ms`);
    
    res.json({
      ...response.data,
      latency_ms: latency
    });
  } catch (error: any) {
    const latency = Date.now() - Date.now();
    console.error(`RTB bid failed after ${latency}ms:`, error.message);
    
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || 'Bid request failed',
      latency_ms: latency
    });
  }
});

router.post('/win', validateAPIKey, async (req: Request, res: Response) => {
  try {
    const response = await rtbService.post('/win', req.body);
    
    const analyticsService = new HTTPClient('analytics');
    analyticsService.post('/events', {
      event_type: 'ad_win',
      campaign_id: req.body.campaign_id,
      bid_id: req.body.bid_id,
      price_cents: req.body.price_cents,
      timestamp: new Date().toISOString()
    }).catch(err => console.error('Analytics tracking failed:', err));
    
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || 'Win notification failed'
    });
  }
});

router.post('/impression', async (req: Request, res: Response) => {
  try {
    const analyticsService = new HTTPClient('analytics');
    const response = await analyticsService.post('/events', {
      event_type: 'impression',
      campaign_id: req.body.campaign_id,
      creative_id: req.body.creative_id,
      episode_id: req.body.episode_id,
      user_id: req.body.user_id,
      timestamp: new Date().toISOString(),
      metadata: req.body.metadata
    });
    
    res.json({ status: 'tracked', event_id: response.data.id });
  } catch (error: any) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || 'Failed to track impression'
    });
  }
});

router.post('/click', async (req: Request, res: Response) => {
  try {
    const analyticsService = new HTTPClient('analytics');
    const response = await analyticsService.post('/events', {
      event_type: 'click',
      campaign_id: req.body.campaign_id,
      creative_id: req.body.creative_id,
      episode_id: req.body.episode_id,
      user_id: req.body.user_id,
      click_url: req.body.click_url,
      timestamp: new Date().toISOString(),
      metadata: req.body.metadata
    });
    
    if (req.body.click_url) {
      res.redirect(302, req.body.click_url);
    } else {
      res.json({ status: 'tracked', event_id: response.data.id });
    }
  } catch (error: any) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || 'Failed to track click'
    });
  }
});

router.get('/creative/:id', async (req: Request, res: Response) => {
  try {
    const inventoryService = new HTTPClient('inventory');
    const response = await inventoryService.get(`/creatives/${req.params.id}`);
    
    if (response.data.type === 'audio') {
      res.redirect(response.data.url);
    } else {
      res.json(response.data);
    }
  } catch (error: any) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || 'Failed to serve creative'
    });
  }
});

export default router;