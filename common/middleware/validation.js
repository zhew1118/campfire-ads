"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validators = exports.createValidator = exports.commonSchemas = exports.RequestValidator = void 0;
const joi_1 = __importDefault(require("joi"));
class RequestValidator {
    defaultOptions;
    constructor(options = {}) {
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
    validate = (config) => {
        return (req, res, next) => {
            const errors = [];
            const options = { ...this.defaultOptions, ...config.options };
            try {
                // Validate request body
                if (config.body && req.body) {
                    const { error, value } = config.body.validate(req.body, options);
                    if (error) {
                        errors.push(...this.formatJoiErrors(error, 'body'));
                    }
                    else {
                        req.body = value;
                    }
                }
                // Validate query parameters
                if (config.query && req.query) {
                    const { error, value } = config.query.validate(req.query, options);
                    if (error) {
                        errors.push(...this.formatJoiErrors(error, 'query'));
                    }
                    else {
                        req.query = value;
                    }
                }
                // Validate URL parameters
                if (config.params && req.params) {
                    const { error, value } = config.params.validate(req.params, options);
                    if (error) {
                        errors.push(...this.formatJoiErrors(error, 'params'));
                    }
                    else {
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
            }
            catch (err) {
                return res.status(500).json({
                    error: 'Validation processing error',
                    code: 'VALIDATION_PROCESSING_ERROR'
                });
            }
        };
    };
    formatJoiErrors(joiError, location) {
        return joiError.details.map(detail => ({
            field: `${location}.${detail.path.join('.')}`,
            message: detail.message,
            value: detail.context?.value
        }));
    }
}
exports.RequestValidator = RequestValidator;
// Common validation schemas for the podcast advertising platform
exports.commonSchemas = {
    // Pagination
    pagination: joi_1.default.object({
        page: joi_1.default.number().integer().min(1).default(1),
        limit: joi_1.default.number().integer().min(1).max(100).default(20),
        sort: joi_1.default.string().valid('asc', 'desc').default('desc'),
        sortBy: joi_1.default.string().default('created_at')
    }),
    // User identification
    userId: joi_1.default.string().uuid({ version: 'uuidv4' }).required(),
    // Campaign schemas
    campaign: {
        create: joi_1.default.object({
            name: joi_1.default.string().min(3).max(100).required(),
            description: joi_1.default.string().max(500).optional(),
            budget_cents: joi_1.default.number().integer().min(100).required(), // Minimum $1
            daily_budget_cents: joi_1.default.number().integer().min(50).optional(),
            start_date: joi_1.default.date().iso().greater('now').required(),
            end_date: joi_1.default.date().iso().greater(joi_1.default.ref('start_date')).required(),
            targeting: joi_1.default.object({
                categories: joi_1.default.array().items(joi_1.default.string()).min(1).required(),
                demographics: joi_1.default.object({
                    age_range: joi_1.default.string().valid('18-24', '25-34', '35-44', '45-54', '55+').optional(),
                    gender: joi_1.default.string().valid('male', 'female', 'other', 'any').optional(),
                    interests: joi_1.default.array().items(joi_1.default.string()).optional()
                }).optional(),
                geo: joi_1.default.object({
                    countries: joi_1.default.array().items(joi_1.default.string().length(2)).optional(), // ISO country codes
                    regions: joi_1.default.array().items(joi_1.default.string()).optional(),
                    exclude_countries: joi_1.default.array().items(joi_1.default.string().length(2)).optional()
                }).optional()
            }).required(),
            bid_strategy: joi_1.default.string().valid('cpm', 'cpc', 'cpa').default('cpm'),
            max_bid_cents: joi_1.default.number().integer().min(10).required() // Minimum 10 cents
        }),
        update: joi_1.default.object({
            name: joi_1.default.string().min(3).max(100).optional(),
            description: joi_1.default.string().max(500).optional(),
            daily_budget_cents: joi_1.default.number().integer().min(50).optional(),
            end_date: joi_1.default.date().iso().optional(),
            targeting: joi_1.default.object().optional(),
            bid_strategy: joi_1.default.string().valid('cpm', 'cpc', 'cpa').optional(),
            max_bid_cents: joi_1.default.number().integer().min(10).optional()
        })
    },
    // Podcast schemas
    podcast: {
        create: joi_1.default.object({
            title: joi_1.default.string().min(3).max(200).required(),
            description: joi_1.default.string().max(1000).optional(),
            rss_feed_url: joi_1.default.string().uri().required(),
            category: joi_1.default.string().required(),
            explicit: joi_1.default.boolean().default(false),
            language: joi_1.default.string().length(2).default('en'), // ISO language codes
            website: joi_1.default.string().uri().optional(),
            author: joi_1.default.string().max(100).optional()
        }),
        update: joi_1.default.object({
            title: joi_1.default.string().min(3).max(200).optional(),
            description: joi_1.default.string().max(1000).optional(),
            category: joi_1.default.string().optional(),
            explicit: joi_1.default.boolean().optional(),
            website: joi_1.default.string().uri().optional(),
            author: joi_1.default.string().max(100).optional()
        })
    },
    // RTB bid request validation
    rtb: {
        bidRequest: joi_1.default.object({
            id: joi_1.default.string().required(),
            episode_id: joi_1.default.string().uuid().required(),
            ad_slot: joi_1.default.object({
                position: joi_1.default.string().valid('pre_roll', 'mid_roll', 'post_roll').required(),
                duration: joi_1.default.number().integer().min(5).max(120).required(), // 5 seconds to 2 minutes
                floor_price_cents: joi_1.default.number().integer().min(1).optional()
            }).required(),
            context: joi_1.default.object({
                podcast_id: joi_1.default.string().uuid().required(),
                category: joi_1.default.string().required(),
                demographics: joi_1.default.object({
                    age_range: joi_1.default.string().optional(),
                    gender: joi_1.default.string().optional(),
                    interests: joi_1.default.array().items(joi_1.default.string()).optional()
                }).optional(),
                geo: joi_1.default.object({
                    country: joi_1.default.string().length(2).required(),
                    region: joi_1.default.string().optional(),
                    city: joi_1.default.string().optional()
                }).optional()
            }).required(),
            timeout_ms: joi_1.default.number().integer().min(10).max(1000).default(100)
        }),
        bidResponse: joi_1.default.object({
            bid_price_cents: joi_1.default.number().integer().min(1).required(),
            campaign_id: joi_1.default.string().uuid().required(),
            creative_url: joi_1.default.string().uri().required(),
            tracking_urls: joi_1.default.object({
                impression: joi_1.default.string().uri().required(),
                click: joi_1.default.string().uri().required(),
                completion: joi_1.default.string().uri().optional()
            }).required(),
            metadata: joi_1.default.object().optional()
        })
    },
    // Analytics event validation
    analytics: {
        event: joi_1.default.object({
            event_type: joi_1.default.string().valid('impression', 'click', 'completion', 'ad_win', 'error').required(),
            campaign_id: joi_1.default.string().uuid().optional(),
            creative_id: joi_1.default.string().uuid().optional(),
            episode_id: joi_1.default.string().uuid().optional(),
            user_id: joi_1.default.string().optional(), // Can be anonymous
            timestamp: joi_1.default.date().iso().default(() => new Date()),
            metadata: joi_1.default.object().optional(),
            session_id: joi_1.default.string().optional(),
            user_agent: joi_1.default.string().optional(),
            ip_address: joi_1.default.string().ip().optional()
        }),
        batchEvents: joi_1.default.object({
            events: joi_1.default.array().items(joi_1.default.object().unknown()).min(1).max(100).required() // Max 100 events per batch
        })
    },
    // Audio processing validation
    audio: {
        insertionRequest: joi_1.default.object({
            episode_id: joi_1.default.string().uuid().required(),
            audio_url: joi_1.default.string().uri().required(),
            ad_placements: joi_1.default.array().items(joi_1.default.object({
                position: joi_1.default.string().valid('pre_roll', 'mid_roll', 'post_roll').required(),
                timestamp: joi_1.default.number().min(0).optional(), // For mid-roll
                creative_url: joi_1.default.string().uri().required(),
                duration: joi_1.default.number().integer().min(5).max(120).required()
            })).min(1).required(),
            output_format: joi_1.default.string().valid('mp3', 'wav', 'aac').default('mp3'),
            quality: joi_1.default.string().valid('low', 'medium', 'high').default('medium')
        })
    },
    // User authentication validation
    auth: {
        register: joi_1.default.object({
            email: joi_1.default.string().email().required(),
            password: joi_1.default.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])')).required(),
            role: joi_1.default.string().valid('podcaster', 'advertiser').required(),
            company_name: joi_1.default.string().max(100).when('role', { is: 'advertiser', then: joi_1.default.required() }),
            full_name: joi_1.default.string().min(2).max(100).required(),
            terms_accepted: joi_1.default.boolean().valid(true).required()
        }),
        login: joi_1.default.object({
            email: joi_1.default.string().email().required(),
            password: joi_1.default.string().required()
        }),
        resetPassword: joi_1.default.object({
            email: joi_1.default.string().email().required()
        }),
        changePassword: joi_1.default.object({
            current_password: joi_1.default.string().required(),
            new_password: joi_1.default.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])')).required(),
            confirm_password: joi_1.default.string().valid(joi_1.default.ref('new_password')).required()
        })
    }
};
// Export validation middleware factory
const createValidator = (options) => new RequestValidator(options);
exports.createValidator = createValidator;
// Export commonly used validators
exports.validators = {
    // Quick validation helpers
    requireAuth: (0, exports.createValidator)().validate({
        headers: joi_1.default.object({
            authorization: joi_1.default.string().pattern(/^Bearer\s+/).required()
        }).unknown()
    }),
    requireApiKey: (0, exports.createValidator)().validate({
        headers: joi_1.default.object({
            'x-api-key': joi_1.default.string().required()
        }).unknown()
    }),
    pagination: (0, exports.createValidator)().validate({
        query: exports.commonSchemas.pagination
    }),
    // Resource ID validation
    validateId: (paramName = 'id') => (0, exports.createValidator)().validate({
        params: joi_1.default.object({
            [paramName]: joi_1.default.string().uuid().required()
        })
    })
};
//# sourceMappingURL=validation.js.map