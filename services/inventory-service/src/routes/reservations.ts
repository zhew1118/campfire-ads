import { Router } from 'express';
import { 
  AuthenticatedRequest, 
  createValidator, 
  createAuthMiddleware,
  validators,
  asyncHandler,
  NotFoundError
} from '../../../../common/middleware';
import Joi from 'joi';
import { APIResponse } from '../../../../common/types';
import { ReservationService } from '../services/reservationService';

const router = Router();
const validator = createValidator();
const authMiddleware = createAuthMiddleware({
  secret: process.env.JWT_SECRET || 'development-jwt-secret-key'
});
const reservationService = new ReservationService();

// POST /reservations/reserve - Reserve an ad slot (advertiser only)
router.post('/reserve',
  authMiddleware.requireRole(['advertiser', 'admin']),
  validator.validate({
    body: Joi.object({
      ad_slot_id: Joi.string().uuid().required(),
      campaign_id: Joi.string().uuid().required(),
      bid_cpm_micros: Joi.number().min(0).required() // bid in micros (e.g., 1000000 = $1.00 CPM)
    })
  }),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const advertiserId = req.user?.id;
    
    if (!advertiserId) {
      throw new NotFoundError('Authentication required');
    }

    const { ad_slot_id, campaign_id, bid_cpm_micros } = req.body;

    const reservation = await reservationService.reserveSlot(
      ad_slot_id,
      campaign_id,
      advertiserId,
      bid_cpm_micros
    );
    
    const response: APIResponse = {
      status: 'success',
      timestamp: new Date().toISOString(),
      data: {
        reservation,
        expires_in_seconds: 60,
        message: 'Slot reserved for 60 seconds'
      }
    };
    
    res.status(201).json(response);
  })
);

// POST /reservations/:id/confirm - Confirm a reservation (RTB engine use)
router.post('/:id/confirm',
  validators.validateId('id'),
  authMiddleware.requireRole(['advertiser', 'admin']),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const advertiserId = req.user?.id;
    
    if (!advertiserId) {
      throw new NotFoundError('Authentication required');
    }

    const reservation = await reservationService.confirmReservation(req.params.id, advertiserId);
    
    if (!reservation) {
      throw new NotFoundError('Reservation not found or already expired');
    }
    
    const response: APIResponse = {
      status: 'success',
      timestamp: new Date().toISOString(),
      data: {
        reservation,
        message: 'Reservation confirmed - slot is now booked'
      }
    };
    
    res.json(response);
  })
);

// POST /reservations/:id/release - Release a reservation
router.post('/:id/release',
  validators.validateId('id'),
  authMiddleware.requireRole(['advertiser', 'admin']),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const advertiserId = req.user?.id;
    
    if (!advertiserId) {
      throw new NotFoundError('Authentication required');
    }

    const result = await reservationService.releaseReservation(req.params.id, advertiserId);
    
    if (!result) {
      throw new NotFoundError('Reservation not found or already processed');
    }
    
    const response: APIResponse = {
      status: 'success',
      timestamp: new Date().toISOString(),
      data: {
        ...result,
        message: 'Reservation released successfully'
      }
    };
    
    res.json(response);
  })
);

// GET /reservations/slots/:id - Get all reservations for a slot (RTB engine + slot owner)
router.get('/slots/:id',
  validators.validateId('id'),
  authMiddleware.requireRole(['admin', 'podcaster']), // Admin or podcaster who owns the slot
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    const reservations = await reservationService.getSlotReservations(req.params.id, userId, userRole);
    
    const response: APIResponse = {
      status: 'success',
      timestamp: new Date().toISOString(),
      data: {
        slot_id: req.params.id,
        reservations,
        bid_count: reservations.length
      }
    };
    
    res.json(response);
  })
);

// GET /reservations/campaigns/:id - Get reservations for a campaign
router.get('/campaigns/:id',
  validators.validateId('id'),
  authMiddleware.requireRole(['advertiser', 'admin']),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const advertiserId = req.user?.id;
    
    if (!advertiserId) {
      throw new NotFoundError('Authentication required');
    }

    const reservations = await reservationService.getCampaignReservations(req.params.id, advertiserId);
    
    const response: APIResponse = {
      status: 'success',
      timestamp: new Date().toISOString(),
      data: {
        campaign_id: req.params.id,
        reservations,
        total: reservations.length
      }
    };
    
    res.json(response);
  })
);

// GET /reservations/available - Get available slots for RTB
router.get('/available',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { 
      category, 
      min_cpm, 
      max_cpm, 
      position, 
      duration,
      page = 1, 
      limit = 20 
    } = req.query as any;

    // Enforce pagination limits
    const actualLimit = Math.min(parseInt(limit) || 20, 100);
    const actualPage = Math.max(parseInt(page) || 1, 1);

    const filters = {
      category,
      position,
      minCpm: min_cpm ? parseFloat(min_cpm) : undefined,
      maxCpm: max_cpm ? parseFloat(max_cpm) : undefined,
      duration: duration ? parseInt(duration) : undefined,
      page: actualPage,
      limit: actualLimit
    };

    const result = await reservationService.getAvailableSlots(filters);
    
    const response: APIResponse = {
      status: 'success',
      timestamp: new Date().toISOString(),
      data: {
        available_slots: result.slots,
        pagination: {
          page: actualPage,
          limit: actualLimit,
          total: result.total,
          totalPages: Math.ceil(result.total / actualLimit)
        },
        filters
      }
    };
    
    res.json(response);
  })
);

// GET /reservations/stats - Get reservation statistics
router.get('/stats',
  authMiddleware.requireRole(['admin']),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const stats = await reservationService.getReservationStats();
    
    const response: APIResponse = {
      status: 'success',
      timestamp: new Date().toISOString(),
      data: stats
    };
    
    res.json(response);
  })
);

// POST /reservations/cleanup - Manual cleanup of expired reservations
router.post('/cleanup',
  authMiddleware.requireRole(['admin']),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const expiredCount = await reservationService.expireOldReservations();
    
    const response: APIResponse = {
      status: 'success',
      timestamp: new Date().toISOString(),
      data: {
        expired_count: expiredCount,
        message: `Expired ${expiredCount} old reservations`
      }
    };
    
    res.json(response);
  })
);

export { router as reservationRoutes };