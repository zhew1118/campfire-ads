import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../../../common/middleware';
import { HTTPClient } from '../services/httpClient';

const router = Router();
const inventoryService = new HTTPClient('inventory');

// Global Creative Library Routes

// POST /api/creatives - Upload new creative to advertiser's library
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const response = await inventoryService.post('/creatives', req.body, {
      headers: {
        'Authorization': req.headers.authorization,
        'Content-Type': req.headers['content-type']
      }
    });
    res.status(201).json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || 'Failed to upload creative'
    });
  }
});

// GET /api/creatives - List advertiser's creative library
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const response = await inventoryService.get('/creatives', {
      params: req.query,
      headers: {
        'Authorization': req.headers.authorization
      }
    });
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || 'Failed to fetch creatives'
    });
  }
});

// GET /api/creatives/:id - Get creative details
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const response = await inventoryService.get(`/creatives/${req.params.id}`, {
      headers: {
        'Authorization': req.headers.authorization
      }
    });
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || 'Failed to fetch creative'
    });
  }
});

// GET /api/creatives/:id/download - Download creative file
router.get('/:id/download', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const response = await inventoryService.get(`/creatives/${req.params.id}/download`, {
      headers: {
        'Authorization': req.headers.authorization
      },
      responseType: 'stream'
    });
    
    // Forward headers from inventory service
    if (response.headers['content-disposition']) {
      res.setHeader('Content-Disposition', response.headers['content-disposition']);
    }
    if (response.headers['content-type']) {
      res.setHeader('Content-Type', response.headers['content-type']);
    }
    if (response.headers['content-length']) {
      res.setHeader('Content-Length', response.headers['content-length']);
    }
    
    response.data.pipe(res);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || 'Failed to download creative'
    });
  }
});

// PUT /api/creatives/:id - Update creative metadata
router.put('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const response = await inventoryService.put(`/creatives/${req.params.id}`, req.body, {
      headers: {
        'Authorization': req.headers.authorization
      }
    });
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || 'Failed to update creative'
    });
  }
});

// DELETE /api/creatives/:id - Delete creative from library
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    await inventoryService.delete(`/creatives/${req.params.id}`, {
      headers: {
        'Authorization': req.headers.authorization
      }
    });
    res.status(204).send();
  } catch (error: any) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || 'Failed to delete creative'
    });
  }
});

export default router;