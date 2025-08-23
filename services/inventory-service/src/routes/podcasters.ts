import { Router } from 'express';
import { 
  AuthenticatedRequest, 
  createValidator, 
  validators,
  asyncHandler,
  NotFoundError
} from '../../../../common/middleware';
import Joi from 'joi';
import { APIResponse } from '../../../../common/types';
import { PodcasterService } from '../services/podcasterService';

const router = Router();
const validator = createValidator();
const podcasterService = new PodcasterService();

// GET /podcasters - Get all podcasters (admin/public view)
router.get('/', 
  validators.pagination,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { page = 1, limit = 20 } = req.query as any;
    const result = await podcasterService.getAllPodcasters(page, limit);
    
    const response: APIResponse = {
      status: 'success',
      timestamp: new Date().toISOString(),
      data: {
        podcasters: result.podcasters,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: result.total,
          totalPages: Math.ceil(result.total / limit)
        }
      }
    };
    
    res.json(response);
  })
);

// POST /podcasters - Create a new podcaster (registration)
router.post('/',
  validator.validate({
    body: Joi.object({
      email: Joi.string().email().required(),
      password_hash: Joi.string().required(), // Should be pre-hashed by auth service
      first_name: Joi.string().max(100).optional(),
      last_name: Joi.string().max(100).optional(),
      company_name: Joi.string().max(255).optional()
    })
  }),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const podcaster = await podcasterService.createPodcaster(req.body);
    
    const response: APIResponse = {
      status: 'success',
      timestamp: new Date().toISOString(),
      data: podcaster
    };
    
    res.status(201).json(response);
  })
);

// GET /podcasters/:id - Get a specific podcaster
router.get('/:id',
  validators.validateId('id'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const podcaster = await podcasterService.getPodcasterById(req.params.id);
    
    if (!podcaster) {
      throw new NotFoundError('Podcaster not found');
    }
    
    const response: APIResponse = {
      status: 'success',
      timestamp: new Date().toISOString(),
      data: podcaster
    };
    
    res.json(response);
  })
);

// PUT /podcasters/:id - Update a podcaster
router.put('/:id',
  validators.validateId('id'),
  validator.validate({
    body: Joi.object({
      first_name: Joi.string().max(100).optional(),
      last_name: Joi.string().max(100).optional(),
      company_name: Joi.string().max(255).optional()
    })
  }),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const podcaster = await podcasterService.updatePodcaster(req.params.id, req.body);
    
    if (!podcaster) {
      throw new NotFoundError('Podcaster not found');
    }
    
    const response: APIResponse = {
      status: 'success',
      timestamp: new Date().toISOString(),
      data: podcaster
    };
    
    res.json(response);
  })
);

// DELETE /podcasters/:id - Delete a podcaster
router.delete('/:id',
  validators.validateId('id'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const deleted = await podcasterService.deletePodcaster(req.params.id);
    
    if (!deleted) {
      throw new NotFoundError('Podcaster not found');
    }
    
    res.status(204).send();
  })
);

// GET /podcasters/:id/podcasts - Get podcasts for a specific podcaster
router.get('/:id/podcasts',
  validators.validateId('id'),
  validators.pagination,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { page = 1, limit = 20 } = req.query as any;
    const result = await podcasterService.getPodcasterPodcasts(req.params.id, page, limit);
    
    const response: APIResponse = {
      status: 'success',
      timestamp: new Date().toISOString(),
      data: {
        podcasts: result.podcasts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: result.total,
          totalPages: Math.ceil(result.total / limit)
        }
      }
    };
    
    res.json(response);
  })
);

export { router as podcasterRoutes };