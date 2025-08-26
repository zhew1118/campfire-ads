import { Router } from 'express';
import multer from 'multer';
import { 
  AuthenticatedRequest, 
  createValidator,
  validators,
  asyncHandler,
  NotFoundError
} from '../../../../common/middleware';
import Joi from 'joi';
import { APIResponse } from '../../../../common/types';
import { CreativeService } from '../services/creativeService';

const router = Router();
const validator = createValidator();
const creativeService = new CreativeService();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB limit
  }
});

// Validation schemas
const createCreativeSchema = Joi.object({
  name: Joi.string().required().min(1).max(255),
  creative_type: Joi.string().valid('image', 'audio', 'video').optional(),
  width: Joi.number().integer().positive().optional(),
  height: Joi.number().integer().positive().optional(),
  duration: Joi.number().integer().positive().optional()
});

const updateCreativeSchema = Joi.object({
  name: Joi.string().min(1).max(255).optional(),
  creative_type: Joi.string().valid('image', 'audio', 'video').optional(),
  width: Joi.number().integer().positive().optional(),
  height: Joi.number().integer().positive().optional(),
  duration: Joi.number().integer().positive().optional()
});

// POST /creatives - Upload new creative to advertiser's library
router.post('/',
  upload.single('file'),
  validator.validate({
    body: createCreativeSchema
  }),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id;
    const userRole = req.user?.role || 'advertiser';
    
    if (!userId) {
      throw new NotFoundError('Authentication required');
    }

    if (userRole !== 'advertiser' && userRole !== 'admin') {
      throw new NotFoundError('Only advertisers can upload creatives');
    }

    if (!req.file) {
      throw new NotFoundError('File is required');
    }

    // Validate file
    const validation = creativeService.validateCreative(req.file);
    if (!validation.isValid) {
      throw new NotFoundError(validation.errors.join(', '));
    }

    const creative = await creativeService.createCreative(
      userId,
      req.file,
      req.body,
      req.ip
    );
    
    const response: APIResponse = {
      status: 'success',
      timestamp: new Date().toISOString(),
      data: creative
    };
    
    res.status(201).json(response);
  })
);

// GET /creatives - List advertiser's creative library
router.get('/', 
  validators.pagination,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id;
    const userRole = req.user?.role || 'advertiser';
    
    if (!userId) {
      throw new NotFoundError('Authentication required');
    }

    if (userRole !== 'advertiser' && userRole !== 'admin') {
      throw new NotFoundError('Only advertisers can access creative library');
    }

    const { page = 1, limit = 20 } = req.query as any;
    const result = await creativeService.getAdvertiserCreatives(userId, page, limit);
    
    const response: APIResponse = {
      status: 'success',
      timestamp: new Date().toISOString(),
      data: {
        creatives: result.creatives,
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

// GET /creatives/:id - Get creative details
router.get('/:id',
  validators.validateId('id'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      throw new NotFoundError('Authentication required');
    }

    const creative = await creativeService.getCreativeById(req.params.id, userId);
    
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

// GET /creatives/:id/download - Download creative file
router.get('/:id/download',
  validators.validateId('id'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id;

    if (!userId) {
      throw new NotFoundError('Authentication required');
    }

    const fileInfo = await creativeService.getCreativeFile(req.params.id, userId);
    
    if (!fileInfo) {
      throw new NotFoundError('Creative not found');
    }

    res.setHeader('Content-Type', fileInfo.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileInfo.fileName}"`);
    
    res.sendFile(fileInfo.filePath);
  })
);

// PUT /creatives/:id - Update creative metadata
router.put('/:id',
  validators.validateId('id'),
  validator.validate({
    body: updateCreativeSchema
  }),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    
    if (!userId) {
      throw new NotFoundError('Authentication required');
    }

    const creative = await creativeService.updateCreative(req.params.id, userId, req.body);
    
    if (!creative) {
      throw new NotFoundError('Creative not found or access denied');
    }
    
    const response: APIResponse = {
      status: 'success',
      timestamp: new Date().toISOString(),
      data: creative
    };
    
    res.json(response);
  })
);

// DELETE /creatives/:id - Delete creative from library
router.delete('/:id',
  validators.validateId('id'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    
    if (!userId) {
      throw new NotFoundError('Authentication required');
    }

    const deleted = await creativeService.deleteCreative(req.params.id, userId);
    
    if (!deleted) {
      throw new NotFoundError('Creative not found or access denied');
    }
    
    res.status(204).send();
  })
);

export { router as creativesRouter };