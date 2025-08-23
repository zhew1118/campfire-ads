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
import { InventoryService } from '../services/inventoryService';

const router = Router();
const validator = createValidator();
const inventoryService = new InventoryService();

// GET /inventory - Browse available ad slots/inventory
router.get('/', 
  validators.pagination,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { 
      page = 1, 
      limit = 20, 
      category, 
      position, 
      min_cpm, 
      max_cpm, 
      duration 
    } = req.query as any;

    const filters = {
      category,
      position,
      minCpm: min_cpm ? parseFloat(min_cpm) : undefined,
      maxCpm: max_cpm ? parseFloat(max_cpm) : undefined,
      duration: duration ? parseInt(duration) : undefined,
      available: true // Only show available slots
    };

    const result = await inventoryService.browseInventory(filters, page, limit);
    
    const response: APIResponse = {
      status: 'success',
      timestamp: new Date().toISOString(),
      data: {
        inventory: result.slots,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: result.total,
          totalPages: Math.ceil(result.total / limit)
        },
        filters: filters
      }
    };
    
    res.json(response);
  })
);

// GET /inventory/search - Search inventory with more advanced filters
router.get('/search',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { 
      q, // search query
      categories,
      positions,
      min_cpm,
      max_cpm,
      min_duration,
      max_duration,
      page = 1,
      limit = 20
    } = req.query as any;

    const searchFilters = {
      query: q,
      categories: categories ? categories.split(',') : undefined,
      positions: positions ? positions.split(',') : undefined,
      minCpm: min_cpm ? parseFloat(min_cpm) : undefined,
      maxCpm: max_cpm ? parseFloat(max_cpm) : undefined,
      minDuration: min_duration ? parseInt(min_duration) : undefined,
      maxDuration: max_duration ? parseInt(max_duration) : undefined
    };

    const result = await inventoryService.searchInventory(searchFilters, page, limit);
    
    const response: APIResponse = {
      status: 'success',
      timestamp: new Date().toISOString(),
      data: {
        inventory: result.slots,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: result.total,
          totalPages: Math.ceil(result.total / limit)
        },
        searchFilters
      }
    };
    
    res.json(response);
  })
);

// GET /inventory/:id - Get specific inventory item details
router.get('/:id',
  validators.validateId('id'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const inventoryItem = await inventoryService.getInventoryDetails(req.params.id);
    
    if (!inventoryItem) {
      throw new NotFoundError('Inventory item not found');
    }
    
    const response: APIResponse = {
      status: 'success',
      timestamp: new Date().toISOString(),
      data: inventoryItem
    };
    
    res.json(response);
  })
);

// POST /inventory/:id/reserve - Reserve an inventory slot (for advertisers)
router.post('/:id/reserve',
  validators.validateId('id'),
  validator.validate({
    body: Joi.object({
      campaign_id: Joi.string().uuid().required(),
      bid_cpm: Joi.number().min(0).required()
    })
  }),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.body.reserved_by || req.user?.id;
    
    if (!userId) {
      throw new NotFoundError('User ID required');
    }

    const reservation = await inventoryService.reserveSlot(
      req.params.id, 
      userId, 
      req.body.campaign_id,
      req.body.bid_cpm
    );
    
    const response: APIResponse = {
      status: 'success',
      timestamp: new Date().toISOString(),
      data: reservation
    };
    
    res.status(201).json(response);
  })
);

// GET /inventory/categories - Get available podcast categories
router.get('/meta/categories',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const categories = await inventoryService.getCategories();
    
    const response: APIResponse = {
      status: 'success',
      timestamp: new Date().toISOString(),
      data: { categories }
    };
    
    res.json(response);
  })
);

// GET /inventory/stats - Get inventory statistics
router.get('/meta/stats',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const stats = await inventoryService.getInventoryStats();
    
    const response: APIResponse = {
      status: 'success',
      timestamp: new Date().toISOString(),
      data: stats
    };
    
    res.json(response);
  })
);

export { router as inventoryRoutes };