# Campfire Ads - Centralized Security Middleware

Comprehensive security middleware library for the Campfire Ads microservices platform.

## 🛡️ Security Features

### **Authentication & Authorization**
- **JWT Token Validation** - Secure user authentication with configurable expiry
- **API Key Validation** - Service-to-service authentication
- **Role-Based Access Control** - Granular permission management
- **Resource Ownership** - Ensure users can only access their data

### **Rate Limiting** 
- **Redis-Powered** - Distributed rate limiting across services
- **RTB Ultra-Fast** - Sub-10ms rate limiting for bidding endpoints
- **Endpoint-Specific** - Different limits per API endpoint
- **Multiple Windows** - Configurable time windows and request counts

### **Request Validation**
- **Joi Schema Validation** - Comprehensive input validation
- **Type Safety** - TypeScript interfaces for all schemas  
- **Common Patterns** - Pre-built schemas for campaigns, podcasts, RTB
- **Sanitization** - Automatic data cleaning and formatting

### **Security Logging**
- **Winston-Powered** - Professional logging with rotation
- **Security Events** - Authentication failures, rate limits, suspicious activity
- **RTB Performance** - Specialized logging for <10ms requirements
- **Request Tracing** - Full request/response lifecycle tracking

### **Security Headers**
- **Helmet Integration** - Industry-standard security headers
- **CSP Protection** - Content Security Policy configuration
- **CORS Management** - Cross-origin request handling
- **Custom Headers** - Platform-specific security headers

## 🚀 Quick Start

### Installation

```bash
cd common/middleware
npm install
npm run build
```

### Basic Usage

```typescript
import {
  createAuthMiddleware,
  createRateLimiter,
  createSecurityLogger,
  createSecurityMiddleware
} from '@campfire-ads/middleware';

// Initialize security components
const auth = createAuthMiddleware({ secret: process.env.JWT_SECRET });
const rateLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, maxRequests: 1000 });
const logger = createSecurityLogger({ level: 'info' });
const security = createSecurityMiddleware();

// Apply to Express app
app.use(security.securityHeaders());
app.use(logger.requestLogger());
app.use(rateLimiter.middleware());
app.use('/api/protected', auth.validateJWT);
```

## 🔐 Authentication Examples

### JWT Authentication
```typescript
// Validate JWT tokens
app.use('/api/users', auth.validateJWT);

// Role-based access
app.use('/api/admin', auth.requireRole('admin'));

// Resource ownership
app.use('/api/campaigns/:id', auth.requireOwnership(
  (req) => getCampaignOwnerId(req.params.id)
));
```

### API Key Authentication
```typescript
// Service-to-service authentication
app.use('/api/rtb', auth.validateAPIKey(process.env.RTB_API_KEY));

// Multiple API keys
app.use('/api/webhooks', auth.validateAPIKey([
  process.env.STRIPE_WEBHOOK_KEY,
  process.env.PAYPAL_WEBHOOK_KEY
]));
```

## ⚡ Rate Limiting Examples

### General Rate Limiting
```typescript
const limiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 1000,
  message: 'Too many requests'
});

app.use(limiter.middleware());
```

### RTB Ultra-Fast Limiting
```typescript
const rtbLimiter = createRateLimiter({
  windowMs: 1000, // 1 second
  maxRequests: 10000
});

// Sub-10ms rate limiting for RTB
app.use('/api/ads/bid', rtbLimiter.rtbMiddleware(10000));
```

### Advanced Endpoint-Specific Limiting
```typescript
const advancedLimiter = createRateLimiter(config);

app.use(advancedLimiter.advancedMiddleware({
  'get:/api/campaigns': { windowMs: 60000, maxRequests: 100 },
  'post:/api/campaigns': { windowMs: 60000, maxRequests: 10 },
  'default': { windowMs: 60000, maxRequests: 50 }
}));
```

## ✅ Validation Examples

### Campaign Validation
```typescript
import { validators, commonSchemas } from '@campfire-ads/middleware';

// Create campaign with full validation
app.post('/api/campaigns', 
  validators.requireAuth,
  createValidator().validate({
    body: commonSchemas.campaign.create
  }),
  createCampaign
);

// Update campaign with partial validation  
app.put('/api/campaigns/:id',
  validators.validateId('id'),
  createValidator().validate({
    body: commonSchemas.campaign.update
  }),
  updateCampaign
);
```

### RTB Request Validation
```typescript
app.post('/api/ads/bid',
  createValidator().validate({
    body: commonSchemas.rtb.bidRequest
  }),
  processBidRequest
);
```

### Custom Validation Schema
```typescript
const customSchema = Joi.object({
  podcast_title: Joi.string().min(3).max(200).required(),
  episode_count: Joi.number().integer().min(1).required(),
  categories: Joi.array().items(Joi.string()).min(1).required()
});

app.post('/api/podcasts',
  createValidator().validate({ body: customSchema }),
  createPodcast
);
```

## 📊 Logging Examples

### Request/Response Logging
```typescript
const logger = createSecurityLogger({
  level: 'info',
  enableFile: true,
  includeRequestBody: true
});

app.use(logger.requestLogger());
app.use(logger.securityEventLogger());
```

### RTB Performance Logging
```typescript
// Specialized logging for <10ms RTB requirements
app.use('/api/ads/bid', logger.rtbLogger());
```

### Custom Security Events
```typescript
// Manual security event logging
logger.logSecurityEvent('SUSPICIOUS_LOGIN', req, {
  reason: 'Multiple failed attempts',
  attempts: 5,
  ip: req.ip
});

// Business event logging
logger.logBusinessEvent('CAMPAIGN_CREATED', {
  campaignId: campaign.id,
  advertiserId: req.user.id,
  budget: campaign.budget_cents
});
```

## 🔒 Security Headers Examples

### Basic Security
```typescript
const security = createSecurityMiddleware();

app.use(security.securityHeaders());
app.use(security.corsMiddleware());
app.use(security.customHeaders());
```

### Advanced Security
```typescript
const security = createSecurityMiddleware({
  enableCSP: true,
  enableHSTS: true,
  trustedDomains: ['*.campfireads.co', 'localhost'],
  cspDirectives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"],
    styleSrc: ["'self'", "https://fonts.googleapis.com"]
  }
});

// Input sanitization
app.use(security.sanitizeInput());

// Request monitoring
app.use(security.securityMonitoring());

// IP allowlist for admin endpoints
app.use('/api/admin', security.ipAllowlist(['192.168.1.100', '10.0.0.50']));
```

## ⚙️ Configuration Management

### Centralized Config
```typescript
import { securityConfig } from '@campfire-ads/middleware/config';

// Get environment-specific configuration
const jwtConfig = securityConfig.getJWTConfig();
const rateLimitConfig = securityConfig.getRateLimitConfig('general');
const loggingConfig = securityConfig.getLoggingConfig();

// Validate configuration
const validation = securityConfig.validateConfig();
if (!validation.valid) {
  console.error('Security configuration errors:', validation.errors);
  process.exit(1);
}
```

### Environment-Specific Settings
```typescript
// Development
const devConfig = createSecurityConfig('development');

// Production  
const prodConfig = createSecurityConfig('production');

// Custom environment
const customConfig = createSecurityConfig('staging');
```

## 🎯 Performance Targets

### RTB Requirements
- **Rate Limiting**: <1ms overhead for bid requests
- **Validation**: <2ms for bid request validation  
- **Logging**: Async logging with <0.5ms sync overhead
- **Headers**: <0.1ms for security header application

### General Performance
- **JWT Validation**: <5ms average
- **Rate Limit Check**: <2ms average (Redis)
- **Request Logging**: <1ms sync + async file writing
- **Input Validation**: <3ms for complex schemas

## 🛠️ Development

### Build
```bash
npm run build      # Compile TypeScript
npm run dev        # Watch mode
npm run clean      # Clean dist directory
```

### Testing
```bash
npm test           # Run test suite
npm run test:watch # Watch mode testing
npm run test:coverage # Coverage report
```

## 📋 Schema Reference

### Common Schemas
- `commonSchemas.pagination` - Standard pagination parameters
- `commonSchemas.campaign.create` - Campaign creation validation
- `commonSchemas.campaign.update` - Campaign update validation  
- `commonSchemas.podcast.create` - Podcast creation validation
- `commonSchemas.rtb.bidRequest` - RTB bid request validation
- `commonSchemas.rtb.bidResponse` - RTB bid response validation
- `commonSchemas.analytics.event` - Analytics event validation
- `commonSchemas.auth.register` - User registration validation
- `commonSchemas.auth.login` - User login validation

### Validation Helpers
- `validators.requireAuth` - Require JWT authentication
- `validators.requireApiKey` - Require API key authentication  
- `validators.pagination` - Apply pagination validation
- `validators.validateId(paramName)` - Validate UUID parameters

## 🚨 Security Best Practices

### Production Checklist
- [ ] Set strong `JWT_SECRET` (>32 characters)
- [ ] Configure production Redis URL
- [ ] Enable HSTS in production
- [ ] Set restrictive CSP directives
- [ ] Configure trusted domains correctly
- [ ] Enable file logging with rotation
- [ ] Set appropriate rate limits per endpoint
- [ ] Validate all environment variables

### Monitoring
- Monitor rate limit hit rates
- Track authentication failure patterns  
- Monitor RTB response times
- Alert on suspicious request patterns
- Track security event frequencies

---

**Built for enterprise-grade podcast advertising platform security** 🔒🎙️