import { Router, Request, Response } from 'express';
import { HTTPClient } from '../services/httpClient';

const router = Router();
const trackingService = new HTTPClient('tracking');

// Public redirect endpoints proxied through gateway for consistency
router.get('/i/:trackingKey', async (req: Request, res: Response) => {
  try {
    const { trackingKey } = req.params;
    const response = await trackingService.get(`/i/${encodeURIComponent(trackingKey)}`, {
      headers: {
        'User-Agent': req.get('User-Agent') || '',
        'X-Forwarded-For': req.ip
      },
      maxRedirects: 0,
      validateStatus: (status: number) => status >= 200 && status < 400 // allow 3xx
    });

    if (response.status >= 300 && response.status < 400 && response.headers.location) {
      return res.redirect(response.status, response.headers.location);
    }

    return res.status(response.status).send(response.data);
  } catch (error: any) {
    const status = error.response?.status || 500;
    const location = error.response?.headers?.location;
    if (status >= 300 && status < 400 && location) {
      return res.redirect(status, location);
    }
    return res.status(status).json({ error: 'Tracking redirect failed' });
  }
});

// Support .mp3 extension for IAB compliance
router.get('/i/:trackingKey.mp3', async (req: Request, res: Response) => {
  try {
    const { trackingKey } = req.params;
    const response = await trackingService.get(`/i/${encodeURIComponent(trackingKey)}.mp3`, {
      headers: {
        'User-Agent': req.get('User-Agent') || '',
        'X-Forwarded-For': req.ip,
        'Range': req.get('Range') || '',
        'Referer': req.get('Referer') || ''
      },
      maxRedirects: 0,
      validateStatus: (status: number) => status >= 200 && status < 400
    });

    if (response.status >= 300 && response.status < 400 && response.headers.location) {
      return res.redirect(response.status, response.headers.location);
    }

    return res.status(response.status).send(response.data);
  } catch (error: any) {
    const status = error.response?.status || 500;
    const location = error.response?.headers?.location;
    if (status >= 300 && status < 400 && location) {
      return res.redirect(status, location);
    }
    return res.status(status).json({ error: 'Tracking redirect failed' });
  }
});

router.get('/prefix', async (req: Request, res: Response) => {
  try {
    const url = (req.query.url as string) || '';
    const response = await trackingService.get('/prefix', {
      params: { url },
      headers: {
        'User-Agent': req.get('User-Agent') || '',
        'X-Forwarded-For': req.ip
      },
      maxRedirects: 0,
      validateStatus: (status: number) => status >= 200 && status < 400
    });

    if (response.status >= 300 && response.status < 400 && response.headers.location) {
      return res.redirect(response.status, response.headers.location);
    }
    return res.status(response.status).send(response.data);
  } catch (error: any) {
    const status = error.response?.status || 500;
    const location = error.response?.headers?.location;
    if (status >= 300 && status < 400 && location) {
      return res.redirect(status, location);
    }
    return res.status(status).json({ error: 'Prefix redirect failed' });
  }
});

// Placements API - JWT protected
router.post('/api/placements', async (req: Request, res: Response) => {
  try {
    const response = await trackingService.post('/api/placements', req.body, {
      headers: {
        Authorization: req.get('Authorization') || ''
      }
    });
    return res.status(response.status).json(response.data);
  } catch (error: any) {
    const status = error.response?.status || 500;
    return res.status(status).json(error.response?.data || { error: 'Placement creation failed' });
  }
});

router.get('/api/placements', async (req: Request, res: Response) => {
  try {
    const response = await trackingService.get('/api/placements', {
      params: req.query,
      headers: {
        Authorization: req.get('Authorization') || ''
      }
    });
    return res.status(response.status).json(response.data);
  } catch (error: any) {
    const status = error.response?.status || 500;
    return res.status(status).json(error.response?.data || { error: 'Failed to fetch placements' });
  }
});

router.get('/api/placements/:id', async (req: Request, res: Response) => {
  try {
    const response = await trackingService.get(`/api/placements/${req.params.id}`, {
      headers: {
        Authorization: req.get('Authorization') || ''
      }
    });
    return res.status(response.status).json(response.data);
  } catch (error: any) {
    const status = error.response?.status || 500;
    return res.status(status).json(error.response?.data || { error: 'Failed to fetch placement' });
  }
});

// Host Reports API - JWT protected
router.post('/api/host-reports', async (req: Request, res: Response) => {
  try {
    const response = await trackingService.post('/api/host-reports', req.body, {
      headers: {
        Authorization: req.get('Authorization') || ''
      }
    });
    return res.status(response.status).json(response.data);
  } catch (error: any) {
    const status = error.response?.status || 500;
    return res.status(status).json(error.response?.data || { error: 'Host report creation failed' });
  }
});

router.get('/api/host-reports', async (req: Request, res: Response) => {
  try {
    const response = await trackingService.get('/api/host-reports', {
      params: req.query,
      headers: {
        Authorization: req.get('Authorization') || ''
      }
    });
    return res.status(response.status).json(response.data);
  } catch (error: any) {
    const status = error.response?.status || 500;
    return res.status(status).json(error.response?.data || { error: 'Failed to fetch host reports' });
  }
});

router.get('/api/host-reports/:id', async (req: Request, res: Response) => {
  try {
    const response = await trackingService.get(`/api/host-reports/${req.params.id}`, {
      headers: {
        Authorization: req.get('Authorization') || ''
      }
    });
    return res.status(response.status).json(response.data);
  } catch (error: any) {
    const status = error.response?.status || 500;
    return res.status(status).json(error.response?.data || { error: 'Failed to fetch host report' });
  }
});

export default router;

