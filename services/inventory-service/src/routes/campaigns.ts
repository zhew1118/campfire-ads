import { Router } from 'express';
import { 
  AuthenticatedRequest, 
  createValidator, 
  createAuthMiddleware,
  commonSchemas,
  validators,
  asyncHandler,
  NotFoundError
} from '../../../../common/middleware';
import Joi from 'joi';
import { APIResponse } from '../../../../common/types';
import { CampaignService } from '../services/campaignService';
import { CampaignCreativeService } from '../services/campaignCreativeService';

const router = Router();
const validator = createValidator();
const authMiddleware = createAuthMiddleware({
  secret: process.env.JWT_SECRET || 'development-jwt-secret-key'
});
const campaignService = new CampaignService();
const campaignCreativeService = new CampaignCreativeService();

// GET /campaigns - Get campaigns for user
router.get('/', 
  validators.pagination,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id;
    const userRole = req.user?.role || 'advertiser';
    
    if (!userId) {
      throw new NotFoundError('Authentication required');
    }

    const { page = 1, limit = 20 } = req.query as any;
    const result = await campaignService.getUserCampaigns(userId, userRole, page, limit);
    
    const response: APIResponse = {
      status: 'success',
      timestamp: new Date().toISOString(),
      data: {
        campaigns: result.campaigns,
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

// POST /campaigns - Create a new campaign
router.post('/',
  authMiddleware.requireRole(['advertiser', 'admin']),
  validator.validate({
    body: commonSchemas.campaign.create
  }),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    
    if (!userId) {
      throw new NotFoundError('Authentication required');
    }

    const campaign = await campaignService.createCampaign(userId, userRole, req.body);
    
    const response: APIResponse = {
      status: 'success',
      timestamp: new Date().toISOString(),
      data: campaign
    };
    
    res.status(201).json(response);
  })
);

// GET /campaigns/:id - Get a specific campaign
router.get('/:id',
  validators.validateId('id'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    const campaign = await campaignService.getCampaignById(req.params.id, userId, userRole);
    
    if (!campaign) {
      throw new NotFoundError('Campaign not found');
    }
    
    const response: APIResponse = {
      status: 'success',
      timestamp: new Date().toISOString(),
      data: campaign
    };
    
    res.json(response);
  })
);

// PUT /campaigns/:id - Update a campaign
router.put('/:id',
  validators.validateId('id'),
  validator.validate({
    body: commonSchemas.campaign.update
  }),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    
    if (!userId) {
      throw new NotFoundError('Authentication required');
    }

    const campaign = await campaignService.updateCampaign(req.params.id, userId, userRole, req.body);
    
    if (!campaign) {
      throw new NotFoundError('Campaign not found or access denied');
    }
    
    const response: APIResponse = {
      status: 'success',
      timestamp: new Date().toISOString(),
      data: campaign
    };
    
    res.json(response);
  })
);

// DELETE /campaigns/:id - Delete a campaign
router.delete('/:id',
  validators.validateId('id'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    
    if (!userId) {
      throw new NotFoundError('Authentication required');
    }

    const deleted = await campaignService.deleteCampaign(req.params.id, userId, userRole);
    
    if (!deleted) {
      throw new NotFoundError('Campaign not found or access denied');
    }
    
    res.status(204).send();
  })
);

// POST /campaigns/:id/activate - Activate a campaign
router.post('/:id/activate',
  validators.validateId('id'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    
    if (!userId) {
      throw new NotFoundError('Authentication required');
    }

    const campaign = await campaignService.activateCampaign(req.params.id, userId, userRole);
    
    if (!campaign) {
      throw new NotFoundError('Campaign not found or access denied');
    }
    
    const response: APIResponse = {
      status: 'success',
      timestamp: new Date().toISOString(),
      data: campaign
    };
    
    res.json(response);
  })
);

// POST /campaigns/:id/pause - Pause a campaign
router.post('/:id/pause',
  validators.validateId('id'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    
    if (!userId) {
      throw new NotFoundError('Authentication required');
    }

    const campaign = await campaignService.pauseCampaign(req.params.id, userId, userRole);
    
    if (!campaign) {
      throw new NotFoundError('Campaign not found or access denied');
    }
    
    const response: APIResponse = {
      status: 'success',
      timestamp: new Date().toISOString(),
      data: campaign
    };
    
    res.json(response);
  })
);

// Campaign-Creative Association Routes

// POST /campaigns/:id/creatives - Assign existing creative(s) to campaign
router.post('/:id/creatives',
  validators.validateId('id'),
  validator.validate({
    body: Joi.object({
      creative_ids: Joi.array().items(Joi.string().uuid()).required().min(1)
    })
  }),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    
    if (!userId) {
      throw new NotFoundError('Authentication required');
    }

    if (userRole !== 'advertiser' && userRole !== 'admin') {
      throw new NotFoundError('Only advertisers can assign creatives to campaigns');
    }

    const associations = await campaignCreativeService.assignCreativesToCampaign(
      req.params.id,
      req.body.creative_ids,
      userId
    );
    
    const response: APIResponse = {
      status: 'success',
      timestamp: new Date().toISOString(),
      data: associations
    };
    
    res.status(201).json(response);
  })
);

// DELETE /campaigns/:id/creatives/:creativeId - Detach creative from campaign
router.delete('/:id/creatives/:creativeId',
  validator.validate({
    params: Joi.object({
      id: Joi.string().uuid().required(),
      creativeId: Joi.string().uuid().required()
    })
  }),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    
    if (!userId) {
      throw new NotFoundError('Authentication required');
    }

    const unassigned = await campaignCreativeService.unassignCreativeFromCampaign(
      req.params.id,
      req.params.creativeId,
      userId
    );
    
    if (!unassigned) {
      throw new NotFoundError('Creative assignment not found or access denied');
    }
    
    res.status(204).send();
  })
);

// GET /campaigns/:id/creatives - List creatives assigned to campaign
router.get('/:id/creatives',
  validators.validateId('id'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    
    if (!userId) {
      throw new NotFoundError('Authentication required');
    }

    const unassigned = await campaignCreativeService.unassignCreativeFromCampaign(
      req.params.id,
      req.params.creativeId,
      userId
    );
    
    if (!unassigned) {
      throw new NotFoundError('Creative assignment not found');
    }
    
    res.status(204).send();
  })
);

export { router as campaignRoutes };