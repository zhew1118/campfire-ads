import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

export interface ValidationConfig {
  body?: Joi.ObjectSchema;
  query?: Joi.ObjectSchema;
  params?: Joi.ObjectSchema;
  headers?: Joi.ObjectSchema;
  options?: Joi.ValidationOptions;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export class RequestValidator {
  private defaultOptions: Joi.ValidationOptions;

  constructor(options: Joi.ValidationOptions = {}) {
    this.defaultOptions = {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true,
      presence: 'required',
      ...options
    };
  }

  /**
   * Main validation middleware factory
   */
  validate = (config: ValidationConfig) => {
    return (req: Request, res: Response, next: NextFunction) => {
      const errors: ValidationError[] = [];
      const options = { ...this.defaultOptions, ...config.options };

      try {
        // Validate request body
        if (config.body && req.body) {
          const { error, value } = config.body.validate(req.body, options);
          if (error) {
            errors.push(...this.formatJoiErrors(error, 'body'));
          } else {
            req.body = value;
          }
        }

        // Validate query parameters
        if (config.query && req.query) {
          const { error, value } = config.query.validate(req.query, options);
          if (error) {
            errors.push(...this.formatJoiErrors(error, 'query'));
          } else {
            req.query = value;
          }
        }

        // Validate URL parameters
        if (config.params && req.params) {
          const { error, value } = config.params.validate(req.params, options);
          if (error) {
            errors.push(...this.formatJoiErrors(error, 'params'));
          } else {
            req.params = value;
          }
        }

        // Validate headers
        if (config.headers && req.headers) {
          const { error } = config.headers.validate(req.headers, {
            ...options,
            allowUnknown: true // Headers often have unknown fields
          });
          if (error) {
            errors.push(...this.formatJoiErrors(error, 'headers'));
          }
        }

        if (errors.length > 0) {
          return res.status(400).json({
            error: 'Validation failed',
            code: 'VALIDATION_ERROR',
            details: errors
          });
        }

        next();
      } catch (err) {
        return res.status(500).json({
          error: 'Validation processing error',
          code: 'VALIDATION_PROCESSING_ERROR'
        });
      }
    };
  };

  private formatJoiErrors(joiError: Joi.ValidationError, location: string): ValidationError[] {
    return joiError.details.map(detail => ({
      field: `${location}.${detail.path.join('.')}`,
      message: detail.message,
      value: detail.context?.value
    }));
  }
}

// Common validation schemas for the podcast advertising platform
export const commonSchemas = {
  // Pagination
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sort: Joi.string().valid('asc', 'desc').default('desc'),
    sortBy: Joi.string().default('created_at'),
    user_id: Joi.string().optional()
  }),

  // User identification
  userId: Joi.string().uuid({ version: 'uuidv4' }).required(),
  
  // Campaign schemas
  campaign: {
    create: Joi.object({
      name: Joi.string().min(3).max(100).required(),
      description: Joi.string().max(500).optional(),
      budget_cents: Joi.number().integer().min(100).required(), // Minimum $1
      daily_budget_cents: Joi.number().integer().min(50).optional(),
      start_date: Joi.date().iso().greater('now').required(),
      end_date: Joi.date().iso().greater(Joi.ref('start_date')).required(),
      targeting: Joi.object({
        categories: Joi.array().items(Joi.string()).min(1).required(),
        demographics: Joi.object({
          age_range: Joi.string().valid('18-24', '25-34', '35-44', '45-54', '55+').optional(),
          gender: Joi.string().valid('male', 'female', 'other', 'any').optional(),
          interests: Joi.array().items(Joi.string()).optional()
        }).optional(),
        geo: Joi.object({
          countries: Joi.array().items(Joi.string().length(2)).optional(), // ISO country codes
          regions: Joi.array().items(Joi.string()).optional(),
          exclude_countries: Joi.array().items(Joi.string().length(2)).optional()
        }).optional()
      }).required(),
      bid_strategy: Joi.string().valid('cpm', 'cpc', 'cpa').default('cpm'),
      max_bid_cents: Joi.number().integer().min(10).required() // Minimum 10 cents
    }),

    update: Joi.object({
      name: Joi.string().min(3).max(100).optional(),
      description: Joi.string().max(500).optional(),
      daily_budget_cents: Joi.number().integer().min(50).optional(),
      end_date: Joi.date().iso().optional(),
      targeting: Joi.object().optional(),
      bid_strategy: Joi.string().valid('cpm', 'cpc', 'cpa').optional(),
      max_bid_cents: Joi.number().integer().min(10).optional()
    })
  },

  // Podcast schemas
  podcast: {
    create: Joi.object({
      title: Joi.string().min(3).max(200).required(),
      description: Joi.string().max(1000).optional(),
      rss_feed_url: Joi.string().uri().required(),
      category: Joi.string().required(),
      explicit: Joi.boolean().default(false),
      language: Joi.string().length(2).default('en'), // ISO language codes
      website: Joi.string().uri().optional(),
      author: Joi.string().max(100).optional()
    }),

    update: Joi.object({
      title: Joi.string().min(3).max(200).optional(),
      description: Joi.string().max(1000).optional(),
      category: Joi.string().optional(),
      explicit: Joi.boolean().optional(),
      website: Joi.string().uri().optional(),
      author: Joi.string().max(100).optional()
    })
  },

  // Episode schemas
  episode: {
    create: Joi.object({
      title: Joi.string().min(3).max(200).required(),
      description: Joi.string().max(1000).optional(),
      duration: Joi.number().integer().min(1).required(), // seconds
      audio_url: Joi.string().uri().required(),
      file_size: Joi.number().integer().min(1).optional(), // bytes
      episode_number: Joi.number().integer().min(1).optional(),
      season_number: Joi.number().integer().min(1).optional(),
      published_at: Joi.date().iso().optional(),
      status: Joi.string().valid('draft', 'published', 'archived').default('draft')
    }),

    update: Joi.object({
      title: Joi.string().min(3).max(200).optional(),
      description: Joi.string().max(1000).optional(),
      duration: Joi.number().integer().min(1).optional(),
      audio_url: Joi.string().uri().optional(),
      file_size: Joi.number().integer().min(1).optional(),
      episode_number: Joi.number().integer().min(1).optional(),
      season_number: Joi.number().integer().min(1).optional(),
      published_at: Joi.date().iso().optional(),
      status: Joi.string().valid('draft', 'published', 'archived').optional()
    })
  },

  // Ad slot schemas
  adSlot: {
    create: Joi.object({
      position: Joi.string().valid('pre_roll', 'mid_roll', 'post_roll').required(),
      duration: Joi.number().integer().min(5).max(120).required(), // 5 seconds to 2 minutes
      cpm_floor: Joi.number().precision(2).min(0.01).required(), // minimum CPM in dollars
      available: Joi.boolean().default(true),
      start_time: Joi.number().integer().min(0).optional() // seconds from episode start (for mid-roll)
    }),

    update: Joi.object({
      position: Joi.string().valid('pre_roll', 'mid_roll', 'post_roll').optional(),
      duration: Joi.number().integer().min(5).max(120).optional(),
      cpm_floor: Joi.number().precision(2).min(0.01).optional(),
      available: Joi.boolean().optional(),
      start_time: Joi.number().integer().min(0).optional()
    }),

    pricing: Joi.object({
      cpm_floor: Joi.number().precision(2).min(0.01).required()
    })
  },

  // RTB bid request validation
  rtb: {
    bidRequest: Joi.object({
      id: Joi.string().required(),
      episode_id: Joi.string().uuid().required(),
      ad_slot: Joi.object({
        position: Joi.string().valid('pre_roll', 'mid_roll', 'post_roll').required(),
        duration: Joi.number().integer().min(5).max(120).required(), // 5 seconds to 2 minutes
        floor_price_cents: Joi.number().integer().min(1).optional()
      }).required(),
      context: Joi.object({
        podcast_id: Joi.string().uuid().required(),
        category: Joi.string().required(),
        demographics: Joi.object({
          age_range: Joi.string().optional(),
          gender: Joi.string().optional(),
          interests: Joi.array().items(Joi.string()).optional()
        }).optional(),
        geo: Joi.object({
          country: Joi.string().length(2).required(),
          region: Joi.string().optional(),
          city: Joi.string().optional()
        }).optional()
      }).required(),
      timeout_ms: Joi.number().integer().min(10).max(1000).default(100)
    }),

    bidResponse: Joi.object({
      bid_price_cents: Joi.number().integer().min(1).required(),
      campaign_id: Joi.string().uuid().required(),
      creative_url: Joi.string().uri().required(),
      tracking_urls: Joi.object({
        impression: Joi.string().uri().required(),
        click: Joi.string().uri().required(),
        completion: Joi.string().uri().optional()
      }).required(),
      metadata: Joi.object().optional()
    })
  },

  // Analytics event validation
  analytics: {
    event: Joi.object({
      event_type: Joi.string().valid('impression', 'click', 'completion', 'ad_win', 'error').required(),
      campaign_id: Joi.string().uuid().optional(),
      creative_id: Joi.string().uuid().optional(),
      episode_id: Joi.string().uuid().optional(),
      user_id: Joi.string().optional(), // Can be anonymous
      timestamp: Joi.date().iso().default(() => new Date()),
      metadata: Joi.object().optional(),
      session_id: Joi.string().optional(),
      user_agent: Joi.string().optional(),
      ip_address: Joi.string().ip().optional()
    }),

    batchEvents: Joi.object({
      events: Joi.array().items(Joi.object().unknown()).min(1).max(100).required() // Max 100 events per batch
    })
  },

  // Audio processing validation
  audio: {
    insertionRequest: Joi.object({
      episode_id: Joi.string().uuid().required(),
      audio_url: Joi.string().uri().required(),
      ad_placements: Joi.array().items(
        Joi.object({
          position: Joi.string().valid('pre_roll', 'mid_roll', 'post_roll').required(),
          timestamp: Joi.number().min(0).optional(), // For mid-roll
          creative_url: Joi.string().uri().required(),
          duration: Joi.number().integer().min(5).max(120).required()
        })
      ).min(1).required(),
      output_format: Joi.string().valid('mp3', 'wav', 'aac').default('mp3'),
      quality: Joi.string().valid('low', 'medium', 'high').default('medium')
    })
  },

  // User authentication validation
  auth: {
    register: Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])')).required(),
      role: Joi.string().valid('podcaster', 'advertiser').required(),
      company_name: Joi.string().max(100).when('role', { is: 'advertiser', then: Joi.required() }),
      full_name: Joi.string().min(2).max(100).required(),
      terms_accepted: Joi.boolean().valid(true).required()
    }),

    login: Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().required()
    }),

    resetPassword: Joi.object({
      email: Joi.string().email().required()
    }),

    changePassword: Joi.object({
      current_password: Joi.string().required(),
      new_password: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])')).required(),
      confirm_password: Joi.string().valid(Joi.ref('new_password')).required()
    })
  }
};

// Export validation middleware factory
export const createValidator = (options?: Joi.ValidationOptions) => new RequestValidator(options);

// Export commonly used validators
export const validators = {
  // Quick validation helpers
  requireAuth: createValidator().validate({
    headers: Joi.object({
      authorization: Joi.string().pattern(/^Bearer\s+/).required()
    }).unknown()
  }),

  requireApiKey: createValidator().validate({
    headers: Joi.object({
      'x-api-key': Joi.string().required()
    }).unknown()
  }),

  pagination: createValidator().validate({
    query: commonSchemas.pagination
  }),

  // Resource ID validation
  validateId: (paramName: string = 'id') => createValidator().validate({
    params: Joi.object({
      [paramName]: Joi.string().uuid().required()
    })
  })
};