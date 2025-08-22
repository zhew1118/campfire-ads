import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { HTTPClient } from '../services/httpClient';

const router = Router();
const inventoryService = new HTTPClient('inventory');
const rtbService = new HTTPClient('rtb');

router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const response = await inventoryService.get('/campaigns', {
      params: { ...req.query, user_id: req.user?.id }
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
    const campaignData = {
      ...req.body,
      created_by: req.user?.id,
      user_role: req.user?.role
    };
    
    const response = await inventoryService.post('/campaigns', campaignData);
    
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
    const response = await inventoryService.get(`/campaigns/${req.params.id}`);
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || 'Failed to fetch campaign'
    });
  }
});

router.put('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const response = await inventoryService.put(`/campaigns/${req.params.id}`, req.body);
    
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
    await inventoryService.delete(`/campaigns/${req.params.id}`);
    
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
    const response = await inventoryService.post(`/campaigns/${req.params.id}/activate`);
    
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
    const response = await inventoryService.post(`/campaigns/${req.params.id}/pause`);
    
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

export default router;