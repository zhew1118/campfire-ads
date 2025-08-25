import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../../../common/middleware';
import { HTTPClient } from '../services/httpClient';

const router = Router();
const inventoryService = new HTTPClient('inventory');
const rtbService = new HTTPClient('rtb');

router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const response = await inventoryService.get('/campaigns', {
      params: req.query,
      headers: {
        'Authorization': req.headers.authorization
      }
    });
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || 'Failed to fetch campaigns'
    });
  }
});

router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const response = await inventoryService.post('/campaigns', req.body, {
      headers: {
        'Authorization': req.headers.authorization
      }
    });
    
    if (response.data.id) {
      try {
        await rtbService.post('/campaigns/register', {
          campaign_id: response.data.id,
          targeting: req.body.targeting,
          budget: req.body.budget
        });
      } catch (rtbError) {
        console.error('RTB registration failed:', rtbError);
      }
    }
    
    res.status(201).json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || 'Failed to create campaign'
    });
  }
});

router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const response = await inventoryService.get(`/campaigns/${req.params.id}`, {
      headers: {
        'Authorization': req.headers.authorization
      }
    });
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || 'Failed to fetch campaign'
    });
  }
});

router.put('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const response = await inventoryService.put(`/campaigns/${req.params.id}`, req.body, {
      headers: {
        'Authorization': req.headers.authorization
      }
    });
    
    if (req.body.targeting || req.body.budget) {
      try {
        await rtbService.put(`/campaigns/${req.params.id}`, {
          targeting: req.body.targeting,
          budget: req.body.budget
        });
      } catch (rtbError) {
        console.error('RTB update failed:', rtbError);
      }
    }
    
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || 'Failed to update campaign'
    });
  }
});

router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    await inventoryService.delete(`/campaigns/${req.params.id}`, {
      headers: {
        'Authorization': req.headers.authorization
      }
    });
    
    try {
      await rtbService.delete(`/campaigns/${req.params.id}`);
    } catch (rtbError) {
      console.error('RTB cleanup failed:', rtbError);
    }
    
    res.status(204).send();
  } catch (error: any) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || 'Failed to delete campaign'
    });
  }
});

router.post('/:id/activate', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const response = await inventoryService.post(`/campaigns/${req.params.id}/activate`, {}, {
      headers: {
        'Authorization': req.headers.authorization
      }
    });
    
    try {
      await rtbService.post(`/campaigns/${req.params.id}/activate`);
    } catch (rtbError) {
      console.error('RTB activation failed:', rtbError);
    }
    
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || 'Failed to activate campaign'
    });
  }
});

router.post('/:id/pause', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const response = await inventoryService.post(`/campaigns/${req.params.id}/pause`, {}, {
      headers: {
        'Authorization': req.headers.authorization
      }
    });
    
    try {
      await rtbService.post(`/campaigns/${req.params.id}/pause`);
    } catch (rtbError) {
      console.error('RTB pause failed:', rtbError);
    }
    
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || 'Failed to pause campaign'
    });
  }
});

router.get('/:id/performance', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const analyticsService = new HTTPClient('analytics');
    const response = await analyticsService.get(`/reports/campaign/${req.params.id}`, {
      params: req.query
    });
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || 'Failed to fetch campaign performance'
    });
  }
});

// Campaign Creatives Routes

// POST /campaigns/:id/creatives - Upload creative
router.post('/:id/creatives', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const response = await inventoryService.post(`/campaigns/${req.params.id}/creatives`, req.body, {
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

// GET /campaigns/:id/creatives - List campaign creatives
router.get('/:id/creatives', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const response = await inventoryService.get(`/campaigns/${req.params.id}/creatives`, {
      params: req.query,
      headers: {
        'Authorization': req.headers.authorization
      }
    });
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || 'Failed to fetch campaign creatives'
    });
  }
});

// GET /campaigns/:id/creatives/:creativeId - Get specific creative
router.get('/:id/creatives/:creativeId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const response = await inventoryService.get(`/campaigns/${req.params.id}/creatives/${req.params.creativeId}`, {
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

// GET /campaigns/:id/creatives/:creativeId/download - Download creative file
router.get('/:id/creatives/:creativeId/download', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const response = await inventoryService.get(`/campaigns/${req.params.id}/creatives/${req.params.creativeId}/download`, {
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

// PUT /campaigns/:id/creatives/:creativeId - Update creative metadata
router.put('/:id/creatives/:creativeId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const response = await inventoryService.put(`/campaigns/${req.params.id}/creatives/${req.params.creativeId}`, req.body, {
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

// DELETE /campaigns/:id/creatives/:creativeId - Delete creative
router.delete('/:id/creatives/:creativeId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    await inventoryService.delete(`/campaigns/${req.params.id}/creatives/${req.params.creativeId}`, {
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