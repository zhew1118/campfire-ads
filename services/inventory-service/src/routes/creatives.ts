import { Router } from 'express';
import multer from 'multer';
import { 
  AuthenticatedRequest, 
  createValidator, 
  validators,
  asyncHandler,
  NotFoundError
} from '../../../../common/middleware';
import { ValidationError } from '../../../../common/middleware/errorHandler';
import Joi from 'joi';
import { APIResponse } from '../../../../common/types';
import { CreativeService } from '../services/creativeService';

const router = Router();
const validator = createValidator();
const creativeService = new CreativeService();

// Configure multer for file uploads
const storage = multer.memoryStorage(); // Store in memory for processing
const upload = multer({ 
  storage,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB max file size
  }
});

// POST /:id/creatives - Upload creative (mounted under /campaigns)
router.post('/:id/creatives',
  upload.single('creative'), // 'creative' is the field name
  validator.validate({
    body: Joi.object({
      name: Joi.string().min(1).max(255).required(),
      creative_type: Joi.string().valid('image', 'audio', 'video').optional(), // Will be auto-detected
      width: Joi.number().integer().min(1).optional(),
      height: Joi.number().integer().min(1).optional(),
      duration: Joi.number().integer().min(1).optional()
    })
  }),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const advertiserId = req.user?.id;
    const campaignId = req.params.id;
    const file = req.file;

    if (!advertiserId) {
      throw new NotFoundError('Authentication required');
    }

    if (!file) {
      throw new ValidationError('No file uploaded', 'FILE_REQUIRED');
    }

    // Validate file
    const validation = creativeService.validateCreative(file);
    if (!validation.isValid) {
      throw new ValidationError(`File validation failed: ${validation.errors.join(', ')}`, 'FILE_VALIDATION_FAILED');
    }

    // Determine creative type from MIME type
    let creative_type: 'image' | 'audio' | 'video';
    if (file.mimetype.startsWith('image/')) {
      creative_type = 'image';
    } else if (file.mimetype.startsWith('audio/')) {
      creative_type = 'audio';
    } else if (file.mimetype.startsWith('video/')) {
      creative_type = 'video';
    } else {
      throw new ValidationError('Unsupported file type', 'UNSUPPORTED_FILE_TYPE');
    }

    const creativeData = {
      campaign_id: campaignId,
      name: req.body.name,
      file_name: file.originalname,
      file_size: file.size,
      mime_type: file.mimetype,
      creative_type,
      width: req.body.width,
      height: req.body.height,
      duration: req.body.duration,
      upload_ip: req.ip
    };

    const creative = await creativeService.createCreative(
      campaignId,
      advertiserId,
      creativeData,
      file.buffer
    );

    const response: APIResponse = {
      status: 'success',
      timestamp: new Date().toISOString(),
      data: {
        creative,
        message: 'Creative uploaded successfully'
      }
    };

    res.status(201).json(response);
  })
);

// DEBUG: Test route to see what params we get
router.get('/:id/creatives/:creativeId/debug',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    res.json({
      params: req.params,
      path: req.path,
      originalUrl: req.originalUrl
    });
  })
);

// GET /campaigns/:id/creatives/:creativeId - Get specific creative (MUST come before list route)
router.get('/:id/creatives/:creativeId',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const advertiserId = req.user?.id;
    const creativeId = req.params.creativeId;

    if (!advertiserId) {
      throw new NotFoundError('Authentication required');
    }

    const creative = await creativeService.getCreativeById(creativeId, advertiserId);
    
    if (!creative) {
      throw new NotFoundError('Creative not found');
    }

    const response: APIResponse = {
      status: 'success',
      timestamp: new Date().toISOString(),
      data: creative
    };

    res.json(response);
  })
);

// GET /campaigns/:id/creatives - List campaign creatives
router.get('/:id/creatives',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const advertiserId = req.user?.id;
    const campaignId = req.params.id;

    if (!advertiserId) {
      throw new NotFoundError('Authentication required');
    }

    const result = await creativeService.getCampaignCreatives(campaignId, advertiserId);

    const response: APIResponse = {
      status: 'success',
      timestamp: new Date().toISOString(),
      data: {
        campaign_id: campaignId,
        creatives: result.creatives,
        total: result.total
      }
    };

    res.json(response);
  })
);

// GET /campaigns/:id/creatives/:creativeId/download - Download creative file
router.get('/:id/creatives/:creativeId/download',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const advertiserId = req.user?.id;
    const creativeId = req.params.creativeId;

    if (!advertiserId) {
      throw new NotFoundError('Authentication required');
    }

    const { creative, filePath } = await creativeService.getCreativeFile(creativeId, advertiserId);

    // Set appropriate headers
    res.setHeader('Content-Disposition', `attachment; filename="${creative.file_name}"`);
    res.setHeader('Content-Type', creative.mime_type);
    res.setHeader('Content-Length', creative.file_size.toString());

    res.sendFile(filePath);
  })
);

// PUT /campaigns/:id/creatives/:creativeId - Update creative metadata
router.put('/:id/creatives/:creativeId',
  validator.validate({
    body: Joi.object({
      name: Joi.string().min(1).max(255).optional(),
      is_approved: Joi.boolean().optional(),
      rejection_reason: Joi.string().max(1000).optional()
    })
  }),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const advertiserId = req.user?.id;
    const creativeId = req.params.creativeId;

    if (!advertiserId) {
      throw new NotFoundError('Authentication required');
    }

    const creative = await creativeService.updateCreative(creativeId, advertiserId, req.body);
    
    if (!creative) {
      throw new NotFoundError('Creative not found');
    }

    const response: APIResponse = {
      status: 'success',
      timestamp: new Date().toISOString(),
      data: {
        creative,
        message: 'Creative updated successfully'
      }
    };

    res.json(response);
  })
);

// DELETE /campaigns/:id/creatives/:creativeId - Delete creative
router.delete('/:id/creatives/:creativeId',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const advertiserId = req.user?.id;
    const creativeId = req.params.creativeId;

    if (!advertiserId) {
      throw new NotFoundError('Authentication required');
    }

    const deleted = await creativeService.deleteCreative(creativeId, advertiserId);
    
    if (!deleted) {
      throw new NotFoundError('Creative not found');
    }

    const response: APIResponse = {
      status: 'success',
      timestamp: new Date().toISOString(),
      data: {
        message: 'Creative deleted successfully'
      }
    };

    res.json(response);
  })
);

export { router as creativeRoutes };