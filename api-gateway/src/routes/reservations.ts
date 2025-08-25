import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../../../common/middleware';
import { HTTPClient } from '../services/httpClient';

const router = Router();
const inventoryService = new HTTPClient('inventory');

// POST /reservations/reserve - Reserve an ad slot (advertiser only)
router.post('/reserve', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const response = await inventoryService.post('/reservations/reserve', req.body, {
      headers: {
        'Authorization': req.headers.authorization
      }
    });
    res.status(201).json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || 'Failed to reserve slot'
    });
  }
});

// POST /reservations/:id/confirm - Confirm a reservation
router.post('/:id/confirm', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const response = await inventoryService.post(`/reservations/${req.params.id}/confirm`, req.body, {
      headers: {
        'Authorization': req.headers.authorization
      }
    });
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || 'Failed to confirm reservation'
    });
  }
});

// POST /reservations/:id/release - Release a reservation
router.post('/:id/release', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const response = await inventoryService.post(`/reservations/${req.params.id}/release`, req.body, {
      headers: {
        'Authorization': req.headers.authorization
      }
    });
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || 'Failed to release reservation'
    });
  }
});

// GET /reservations/slots/:id - Get all reservations for a slot
router.get('/slots/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const response = await inventoryService.get(`/reservations/slots/${req.params.id}`, {
      headers: {
        'Authorization': req.headers.authorization
      }
    });
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || 'Failed to fetch slot reservations'
    });
  }
});

// GET /reservations/campaigns/:id - Get reservations for a campaign
router.get('/campaigns/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const response = await inventoryService.get(`/reservations/campaigns/${req.params.id}`, {
      headers: {
        'Authorization': req.headers.authorization
      }
    });
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || 'Failed to fetch campaign reservations'
    });
  }
});

// GET /reservations/available - Get available slots for RTB (public endpoint)
router.get('/available', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const response = await inventoryService.get('/reservations/available', {
      params: req.query
    });
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || 'Failed to fetch available slots'
    });
  }
});

// GET /reservations/stats - Get reservation statistics (admin only)
router.get('/stats', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const response = await inventoryService.get('/reservations/stats', {
      headers: {
        'Authorization': req.headers.authorization
      }
    });
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || 'Failed to fetch reservation stats'
    });
  }
});

// POST /reservations/cleanup - Manual cleanup (admin only)
router.post('/cleanup', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const response = await inventoryService.post('/reservations/cleanup', req.body, {
      headers: {
        'Authorization': req.headers.authorization
      }
    });
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || 'Failed to cleanup reservations'
    });
  }
});

export default router;