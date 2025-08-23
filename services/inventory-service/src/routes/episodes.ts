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
import { EpisodeService } from '../services/episodeService';
import { AdSlotService } from '../services/adSlotService';

const router = Router();
const validator = createValidator();
const episodeService = new EpisodeService();
const adSlotService = new AdSlotService();

// GET /episodes/:id - Get a specific episode
router.get('/:id',
  validators.validateId('id'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id;
    const episode = await episodeService.getEpisodeById(req.params.id, userId);
    
    if (!episode) {
      throw new NotFoundError('Episode not found');
    }
    
    const response: APIResponse = {
      status: 'success',
      timestamp: new Date().toISOString(),
      data: episode
    };
    
    res.json(response);
  })
);

// PUT /episodes/:id - Update an episode
router.put('/:id',
  validators.validateId('id'),
  validator.validate({
    body: commonSchemas.episode.update
  }),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id || req.body.user_id;
    
    if (!userId) {
      throw new NotFoundError('User ID required');
    }

    const episode = await episodeService.updateEpisode(req.params.id, userId, req.body);
    
    if (!episode) {
      throw new NotFoundError('Episode not found or access denied');
    }
    
    const response: APIResponse = {
      status: 'success',
      timestamp: new Date().toISOString(),
      data: episode
    };
    
    res.json(response);
  })
);

// DELETE /episodes/:id - Delete an episode
router.delete('/:id',
  validators.validateId('id'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id || req.body.user_id;
    
    if (!userId) {
      throw new NotFoundError('User ID required');
    }

    const deleted = await episodeService.deleteEpisode(req.params.id, userId);
    
    if (!deleted) {
      throw new NotFoundError('Episode not found or access denied');
    }
    
    res.status(204).send();
  })
);

// GET /episodes/:id/slots - Get ad slots for an episode
router.get('/:id/slots',
  validators.validateId('id'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id;
    const slots = await adSlotService.getEpisodeAdSlots(req.params.id, userId);
    
    const response: APIResponse = {
      status: 'success',
      timestamp: new Date().toISOString(),
      data: {
        slots: slots,
        count: slots.length
      }
    };
    
    res.json(response);
  })
);

// POST /episodes/:id/slots - Create an ad slot for an episode
router.post('/:id/slots',
  validators.validateId('id'),
  validator.validate({
    body: commonSchemas.adSlot.create
  }),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id || req.body.user_id;
    
    if (!userId) {
      throw new NotFoundError('User ID required');
    }

    const slot = await adSlotService.createAdSlot(req.params.id, userId, req.body);
    
    const response: APIResponse = {
      status: 'success',
      timestamp: new Date().toISOString(),
      data: slot
    };
    
    res.status(201).json(response);
  })
);

export { router as episodeRoutes };