import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { HTTPClient } from '../services/httpClient';

const router = Router();
const inventoryService = new HTTPClient('inventory');

router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const response = await inventoryService.get('/inventory', {
      params: req.query
    });
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || 'Failed to fetch inventory'
    });
  }
});

router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const inventoryData = {
      ...req.body,
      created_by: req.user?.id
    };
    
    const response = await inventoryService.post('/inventory', inventoryData);
    res.status(201).json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || 'Failed to create inventory'
    });
  }
});

router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const response = await inventoryService.get(`/inventory/${req.params.id}`);
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || 'Failed to fetch inventory item'
    });
  }
});

router.put('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const response = await inventoryService.put(`/inventory/${req.params.id}`, req.body);
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || 'Failed to update inventory'
    });
  }
});

router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    await inventoryService.delete(`/inventory/${req.params.id}`);
    res.status(204).send();
  } catch (error: any) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || 'Failed to delete inventory'
    });
  }
});

router.get('/search', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const response = await inventoryService.get('/inventory/search', {
      params: req.query
    });
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || 'Failed to search inventory'
    });
  }
});

router.post('/:id/reserve', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const reservationData = {
      ...req.body,
      reserved_by: req.user?.id
    };
    
    const response = await inventoryService.post(`/inventory/${req.params.id}/reserve`, reservationData);
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || 'Failed to reserve inventory'
    });
  }
});

export default router;