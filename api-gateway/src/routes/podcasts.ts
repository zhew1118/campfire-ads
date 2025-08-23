import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../../../common/middleware';
import { HTTPClient } from '../services/httpClient';

const router = Router();
const inventoryService = new HTTPClient('inventory');

router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const queryParams = {
      ...req.query,
      user_id: req.user?.id,
      page: req.query.page || 1,
      limit: req.query.limit || 20,
      sort: req.query.sort || 'desc',
      sortBy: req.query.sortBy || 'created_at'
    };
    
    const response = await inventoryService.get('/podcasts', {
      params: queryParams
    });
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || 'Failed to fetch podcasts'
    });
  }
});

router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const response = await inventoryService.post('/podcasts', req.body);
    res.status(201).json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || 'Failed to create podcast'
    });
  }
});

router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const response = await inventoryService.get(`/podcasts/${req.params.id}`);
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || 'Failed to fetch podcast'
    });
  }
});

router.put('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const response = await inventoryService.put(`/podcasts/${req.params.id}`, req.body);
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || 'Failed to update podcast'
    });
  }
});

router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    await inventoryService.delete(`/podcasts/${req.params.id}`);
    res.status(204).send();
  } catch (error: any) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || 'Failed to delete podcast'
    });
  }
});

router.get('/:id/episodes', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const response = await inventoryService.get(`/podcasts/${req.params.id}/episodes`, {
      params: req.query
    });
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || 'Failed to fetch podcast episodes'
    });
  }
});

router.post('/:id/episodes', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const response = await inventoryService.post(`/podcasts/${req.params.id}/episodes`, req.body);
    res.status(201).json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || 'Failed to create episode'
    });
  }
});

export default router;