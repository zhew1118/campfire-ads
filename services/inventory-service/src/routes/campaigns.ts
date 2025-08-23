import { Router } from 'express';
import { 
  AuthenticatedRequest, 
  createValidator, 
  commonSchemas,
  validators,
  asyncHandler,
  NotFoundError
} from '../../../../common/middleware';
import Joi from 'joi';
import { APIResponse } from '../../../../common/types';
import { CampaignService } from '../services/campaignService';

const router = Router();
const validator = createValidator();
const campaignService = new CampaignService();

// GET /campaigns - Get campaigns for user
router.get('/', 
  validators.pagination,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.query.user_id as string || req.user?.id;
    const userRole = req.query.user_role as string || req.user?.role || 'advertiser';
    
    if (!userId) {
      throw new NotFoundError('User ID required');
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
  validator.validate({
    body: commonSchemas.campaign.create
  }),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.body.created_by || req.user?.id;
    const userRole = req.body.user_role || req.user?.role;
    
    if (!userId) {
      throw new NotFoundError('User ID required');
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
    const userId = req.user?.id || req.body.user_id;
    const userRole = req.user?.role || req.body.user_role;
    
    if (!userId) {
      throw new NotFoundError('User ID required');
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
    const userId = req.user?.id || req.body.user_id;
    const userRole = req.user?.role || req.body.user_role;
    
    if (!userId) {
      throw new NotFoundError('User ID required');
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
    const userId = req.user?.id || req.body.user_id;
    const userRole = req.user?.role || req.body.user_role;
    
    if (!userId) {
      throw new NotFoundError('User ID required');
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
    const userId = req.user?.id || req.body.user_id;
    const userRole = req.user?.role || req.body.user_role;
    
    if (!userId) {
      throw new NotFoundError('User ID required');
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

export { router as campaignRoutes };