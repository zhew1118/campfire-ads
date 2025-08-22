import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../../../common/middleware';
import { HTTPClient } from '../services/httpClient';

const router = Router();
const inventoryService = new HTTPClient('inventory');

router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const response = await inventoryService.get('/advertisers', {
      params: req.query
    });
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || 'Failed to fetch advertisers'
    });
  }
});

router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const response = await inventoryService.post('/advertisers', req.body);
    res.status(201).json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || 'Failed to create advertiser'
    });
  }
});

router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const response = await inventoryService.get(`/advertisers/${req.params.id}`);
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || 'Failed to fetch advertiser'
    });
  }
});

router.put('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const response = await inventoryService.put(`/advertisers/${req.params.id}`, req.body);
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || 'Failed to update advertiser'
    });
  }
});

router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    await inventoryService.delete(`/advertisers/${req.params.id}`);
    res.status(204).send();
  } catch (error: any) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || 'Failed to delete advertiser'
    });
  }
});

router.get('/:id/billing', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const response = await inventoryService.get(`/advertisers/${req.params.id}/billing`, {
      params: req.query
    });
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || 'Failed to fetch billing information'
    });
  }
});

router.post('/:id/payment', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const response = await inventoryService.post(`/advertisers/${req.params.id}/payment`, req.body);
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || 'Failed to process payment'
    });
  }
});

export default router;