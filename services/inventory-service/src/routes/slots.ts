import { Router } from 'express';
import { 
  AuthenticatedRequest, 
  createValidator, 
  commonSchemas,
  validators,
  asyncHandler,
  NotFoundError
} from '../../../../common/middleware';
import { APIResponse } from '../../../../common/types';
import { AdSlotService } from '../services/adSlotService';

const router = Router();
const validator = createValidator();
const adSlotService = new AdSlotService();

// GET /slots/:id - Get a specific ad slot
router.get('/:id',
  validators.validateId('id'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id;
    const slot = await adSlotService.getAdSlotById(req.params.id, userId);
    
    if (!slot) {
      throw new NotFoundError('Ad slot not found');
    }
    
    const response: APIResponse = {
      status: 'success',
      timestamp: new Date().toISOString(),
      data: slot
    };
    
    res.json(response);
  })
);

// PUT /slots/:id - Update an ad slot
router.put('/:id',
  validators.validateId('id'),
  validator.validate({
    body: commonSchemas.adSlot.update
  }),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id || req.body.user_id;
    
    if (!userId) {
      throw new NotFoundError('User ID required');
    }

    const slot = await adSlotService.updateAdSlot(req.params.id, userId, req.body);
    
    if (!slot) {
      throw new NotFoundError('Ad slot not found or access denied');
    }
    
    const response: APIResponse = {
      status: 'success',
      timestamp: new Date().toISOString(),
      data: slot
    };
    
    res.json(response);
  })
);

// PUT /slots/:id/pricing - Update CPM floor pricing
router.put('/:id/pricing',
  validators.validateId('id'),
  validator.validate({
    body: commonSchemas.adSlot.pricing
  }),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id || req.body.user_id;
    
    if (!userId) {
      throw new NotFoundError('User ID required');
    }

    const slot = await adSlotService.updatePricing(req.params.id, userId, req.body);
    
    if (!slot) {
      throw new NotFoundError('Ad slot not found or access denied');
    }
    
    const response: APIResponse = {
      status: 'success',
      timestamp: new Date().toISOString(),
      data: slot
    };
    
    res.json(response);
  })
);

// DELETE /slots/:id - Delete an ad slot
router.delete('/:id',
  validators.validateId('id'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id || req.body.user_id;
    
    if (!userId) {
      throw new NotFoundError('User ID required');
    }

    const deleted = await adSlotService.deleteAdSlot(req.params.id, userId);
    
    if (!deleted) {
      throw new NotFoundError('Ad slot not found or access denied');
    }
    
    res.status(204).send();
  })
);

export { router as adSlotRoutes };