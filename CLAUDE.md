# Claude Code Init File - Campfire Ads

This file contains project context and commonly used commands for the Campfire Ads podcast advertising platform.

## 📋 Quick Architecture Reference

**⚡ For complete architecture details, see: [`stack.md`](./stack.md)**  
The stack.md file contains the full microservices architecture specification, service communication patterns, performance targets, and migration roadmap.

## 🚨 **CRITICAL DEVELOPMENT RULE**

**🔍 BEFORE WRITING ANY CODE - ALWAYS CHECK THESE IN ORDER:**

### 1. **Check API Gateway Routes First** 📡
- **ALWAYS examine `api-gateway/src/routes/` before building new services**
- **Understand existing endpoints** - API Gateway may already proxy to your service
- **Match expected API contracts** - Services must implement what Gateway expects
- **Check service names** - HTTPClient uses specific service names for routing
- **Review request/response patterns** - Follow established data flow

### 2. **Check Common Folder** 📁
- **Check for existing utilities**: `common/middleware/`, `common/config/`, `common/types/`
- **Reuse shared components**: Authentication, validation, security, database connections
- **Follow established patterns**: TypeScript interfaces, error handling, logging
- **Extend existing code**: Don't duplicate functionality that already exists
- **Check imports**: See what other services are already using from common/

**The `common/` folder contains:**
- 🛡️ **Security middleware** - Authentication, rate limiting, validation  
- ⚙️ **Configuration utilities** - Environment-specific settings
- 🔧 **Shared types** - TypeScript interfaces and schemas
- 📊 **Database utilities** - Connection pooling, migrations
- 🚨 **Error handling** - Standardized error responses

### 3. **Architecture Flow Understanding** 🏗️
```
Dashboard → API Gateway → Microservices → Database
    ↓           ↓              ↓           ↓
   React    Proxy/Auth     Business     PostgreSQL
          Validation      Logic        Connection
```

### 4. **Consolidate Duplications** 🧹
- **Check for duplicate files** - types, middleware, utilities across services
- **Remove redundant code** - consolidate into common/ folder
- **Update imports** - ensure all services use common utilities
- **Test after cleanup** - verify services still compile and work

**This prevents:**
- ❌ Building services that don't match Gateway expectations
- ❌ Code duplication across services  
- ❌ Inconsistent API contracts
- ❌ Missing authentication/security patterns
- ❌ Maintenance nightmare from duplicate code

## 🔄 **DOCUMENTATION UPDATE RULE**

**🚨 CRITICAL: When completing any major phase or milestone:**

1. **Update all three documentation files in order:**
   - `README.md` - Project overview, quick start, current features
   - `CLAUDE.md` - Development commands, testing procedures, current status  
   - `stack.md` - Architecture progress, phase completion, performance results

2. **Update content consistently across files:**
   - ✅ Mark completed phases and features
   - 🔄 Update "Next" sections and roadmap
   - 📊 Add performance results and testing outcomes
   - 🏗️ Reflect current project structure

3. **Commit documentation updates together:**
   - Create single commit with all three file updates
   - Use descriptive commit message explaining what was completed
   - Ensure future Claude sessions get accurate project state

**This ensures documentation stays synchronized and Claude sessions have accurate context.**

## 🎯 Current Status: **Phase 2A.5++ Complete - RTB Reservation System FULLY TESTED + Authentication Fixes** ✅

### **Phase 2A Complete:**
- ✅ **API Gateway**: Secure routing with enterprise middleware
- ✅ **Authentication**: JWT + role-based access control  
- ✅ **Rate Limiting**: Redis-powered (10k req/s RTB optimized)
- ✅ **Security**: Comprehensive logging, validation, headers
- ✅ **Dashboard Integration**: React app connected to API Gateway
- ✅ **End-to-End Auth**: Login → JWT → protected routes working
- ✅ **Middleware Cleanup**: Unified common middleware, removed duplicates
- ✅ **API Client**: Dashboard properly authenticates with API Gateway
- ✅ **TypeScript Compilation**: All middleware builds successfully
- ✅ **Docker Production**: Full containerization with working builds
- ✅ **Remote Deployment**: Ready for production deployment

### **Phase 2A.5+ Complete - Full Dashboard & Campaign Management Fixed:**
- ✅ **Complete Dashboard Pages**: Episodes, Ad Slots, Analytics with real data
- ✅ **Full CRUD Operations**: Create, read, update, delete across all entities
- ✅ **Campaign API Fixed**: Pagination parameters, SQL queries, database sample data
- ✅ **TypeScript Consistency**: Resolved Campaign interface conflicts across components
- ✅ **Role-Based Dashboards**: Completely different UIs for podcasters vs advertisers
- ✅ **Modal Forms**: Complete create/edit forms with validation and error handling
- ✅ **API Integration**: All endpoints working with proper query parameters
- ✅ **Authentication Fixes**: Fixed ad slots page authentication with proper header forwarding
- ✅ **Data Flow**: Real PostgreSQL data throughout the entire application
- ✅ **Production Authentication**: Database-connected auth with real user UUIDs
- ✅ **End-to-End Testing**: Manual verification confirms all functionality works
- ✅ **Supply-Side Flow**: Podcasters manage podcasts → episodes → ad slots with pricing
- ✅ **Demand-Side Flow**: Advertisers browse inventory → view analytics → manage campaigns
- ✅ **Business Logic**: Two-sided marketplace with complete separation and functionality

### **Phase 2A.5++ Complete - RTB Reservation System Production Ready:**
- ✅ **Auth Context Security**: Fixed critical vulnerability - removed user_id parameter manipulation
- ✅ **JWT-Only Authentication**: All routes now use authenticated JWT context exclusively
- ✅ **API Gateway Header Forwarding**: Fixed Authorization header forwarding to services
- ✅ **RTB Slot Reservation System**: 60-second slot holds for bidding process - FULLY TESTED
- ✅ **Floor Price Validation**: CPM floor protection working ($1.00 < $2.50 rejected ✅)
- ✅ **Role-Based Authorization**: Only advertisers can reserve slots (podcasters blocked ✅)
- ✅ **Concurrent Bidding**: Multiple advertisers can compete for same slot ✅
- ✅ **Database Schema Updates**: Added slot_reservations table with proper constraints
- ✅ **Reservation API Endpoints**: POST reserve, PUT sell, DELETE release with validation
- ✅ **Middleware Conflict Fix**: Resolved duplicate authentication causing request failures
- ✅ **Test Data Enhancement**: Multiple users, podcasts, campaigns for RTB testing
- ✅ **Security Hardening**: Removed all user_id query/body parameter access
- ✅ **TypeScript Compilation**: Fixed HTTP client header type compatibility issues
- ✅ **Production Testing**: Comprehensive end-to-end validation of all RTB features

## 🎯 **Business Flow Implementation** ✅

### **Two-Sided Marketplace Correctly Implemented:**

**🎙️ PODCASTERS (Supply Side)**
```
Login → My Podcasts → Episodes → Ad Slots → Set CPM Pricing
```
- **Role**: `podcaster`
- **Navigation**: My Podcasts, Episodes, Ad Slots
- **Purpose**: Create and manage their inventory (supply)
- **Actions**: Add podcasts, create episodes, define ad slots, set floor pricing
- **Login**: `test@example.com` / `password123` / `podcaster`

**📢 ADVERTISERS (Demand Side)**  
```
Login → Browse Inventory → View Available Slots → Create Campaigns → Bid
```
- **Role**: `advertiser`  
- **Navigation**: Browse Inventory, My Campaigns, Analytics
- **Purpose**: Discover and purchase inventory (demand)
- **Actions**: Browse podcasts, view available slots, create campaigns
- **Login**: `advertiser@example.com` / `password123` / `advertiser`

### **Key Business Logic Features:**
- ✅ **Role-Based Navigation**: Different UI flows for supply vs demand
- ✅ **Real Database Auth**: JWT tokens contain actual database UUIDs
- ✅ **Supply Management**: Podcasters see their owned content only
- ✅ **Demand Discovery**: Advertisers browse all available inventory
- ✅ **Separation of Concerns**: Clear distinction between marketplace sides
- ✅ **Search-Based Discovery**: Inventory search with filters (no auto-loading)
- ✅ **Database Schema Fixes**: All column references corrected (podcaster_id)

## 🚀 **Next Priority: Campaign Creative Management** 📈

### **Remaining Implementation Gap:**

**📈 Campaign Creatives Management**
- ❌ **Creative Assets**: Campaigns have no creative upload/management system
- ❌ **Asset Storage**: No file storage for images, audio, video creatives
- ❌ **Creative Validation**: No validation for creative specifications

### **Campaign Creatives Implementation Tasks** 📋

```
📈 Campaign Creatives Management
  □ Add campaign_creatives table (id, campaign_id, file_path, type, specs)
  □ Implement POST /api/campaigns/:id/creatives (upload)
  □ Implement GET /api/campaigns/:id/creatives (list)
  □ Implement PUT /api/campaigns/:id/creatives/:id (update)
  □ Implement DELETE /api/campaigns/:id/creatives/:id (delete)
  □ Add file storage service (local/S3 integration)
  □ Add creative validation (size, format, duration limits)
```

## 🚀 **Next Priority: Phase 2B - RTB Engine + Service Completion** 🔄

**COMPLETED** Phase 2A.5 - Inventory Service Foundation ✅  
**NEXT** (Phase 2B) - High-performance RTB engine:

### **Why Phase 2A.5 First?**
- ✅ **Natural progression**: API Gateway → Real inventory → RTB bidding
- ✅ **Immediate user value**: Podcasters add content, advertisers browse
- ✅ **Data foundation**: Real inventory for RTB engine to bid on
- ✅ **Familiar stack**: Node.js + PostgreSQL (no new languages yet)
- ✅ **Dashboard integration**: Extends existing React frontend

### **Implementation Plan:**

1. **Inventory Service (Node.js + PostgreSQL)**
   - CRUD operations for podcasts, episodes, ad slots
   - CPM floor pricing management
   - Pre/mid/post-roll slot configuration  
   - Inventory metadata storage

2. **Database Design**
   ```sql
   podcasts (id, name, category, rss_url, owner_id, created_at)
   episodes (id, podcast_id, title, duration, audio_url, status)
   ad_slots (id, episode_id, position, duration, cpm_floor, available)
   campaigns (id, advertiser_id, name, budget, status, targeting)
   ```

3. **Dashboard Features**
   - **Podcaster Dashboard**: Add podcasts, upload episodes, set CPM pricing
   - **Advertiser Dashboard**: Browse inventory, view available slots  
   - **Basic Analytics**: Inventory stats, campaign performance
   - **Admin Panel**: User management, platform overview

4. **API Endpoints**
   ```
   POST /api/podcasts                    # Create podcast
   GET  /api/podcasts                    # List podcasts
   POST /api/podcasts/{id}/episodes      # Add episode  
   GET  /api/episodes/{id}/slots         # View ad slots
   PUT  /api/slots/{id}/pricing          # Set CPM floors
   GET  /api/inventory/available         # Browse inventory
   POST /api/campaigns                   # Create campaign
   ```

### **Phase 2A.5 Implementation Tasks** ✅ **ALL COMPLETED** 
```
✅ 1. Database Setup
  ✅ Set up PostgreSQL database with Docker
  ✅ Create database schema (podcasters, podcasts, episodes, ad_slots, campaigns)
  ✅ Add database migrations system
  ✅ Set up connection pooling

✅ 2. Inventory Service Development  
  ✅ Create new service directory: services/inventory-service/
  ✅ Set up Express.js + TypeScript + PostgreSQL stack
  ✅ Implement podcast CRUD operations
  ✅ Implement episode management
  ✅ Implement ad slot management with CPM pricing
  ✅ Add input validation with Joi schemas
  ✅ Add authentication middleware integration

✅ 3. Dashboard Integration
  ✅ Create Podcaster dashboard pages (Episodes, Slots, Podcasts with CRUD)
  ✅ Create Advertiser dashboard pages (Inventory Browser, Analytics, Campaigns)  
  ✅ Add complete modal forms for podcast/episode creation
  ✅ Add inventory browsing interface with filtering
  ✅ Add campaign analytics interface
  ✅ Implement role-based dashboard with different UIs

✅ 4. API Gateway Integration
  ✅ Update API Gateway routes to proxy to inventory service
  ✅ Add service discovery for inventory service
  ✅ Update authentication to work with new endpoints
  ✅ Add rate limiting for inventory endpoints
  ✅ Fix API client query parameters for pagination

✅ 5. Testing & Documentation
  ✅ End-to-end testing of all CRUD operations
  ✅ Integration testing of API Gateway ↔ inventory service
  ✅ API documentation updates
  ✅ Database seeding with sample data working
```

### **Phase 2B: RTB Engine (Postponed)** 📅
- **RTB Engine**: High-performance Go + gRPC bidding system  
- **Service Extraction**: Microservices for analytics, audio processing
- **Performance**: Sub-10ms RTB responses, 10k+ req/s capability
- **Rationale**: Build inventory foundation first for better RTB integration

### **Phase 2A Completed Successfully:**
- ✅ **Dashboard**: React app running at `http://localhost:3001`
- ✅ **API Gateway**: Secure gateway at `http://localhost:3000`
- ✅ **Authentication**: JWT login/logout working end-to-end
- ✅ **Integration**: Dashboard ↔ API Gateway communication verified
- ✅ **Security**: All enterprise middleware active and tested
- ✅ **Code Quality**: Middleware duplicates removed, unified architecture

### **Test Accounts Available:**
- **Podcaster**: `test@example.com` / `password123` / `podcaster`
- **Advertiser**: `advertiser@example.com` / `password123` / `advertiser`

## 🛠️ Common Commands

### API Gateway Development
```bash
# Development - Enhanced Security
cd api-gateway
npm run dev:secure          # 🛡️ Start secure version with enterprise middleware
npm run dev                 # Start basic version
npm run build               # Build TypeScript to JavaScript  
npm start:secure            # Run secure production build
npm start                   # Run basic production build
npm run typecheck           # Type checking only
npm run lint                # Code linting

# Testing API Gateway - Security Features
curl http://localhost:3000/health                           # Health check
curl http://localhost:3000/api/podcasters \                # Test JWT authentication
  -H "Authorization: Bearer <jwt_token>"
curl -X POST http://localhost:3000/api/ads/bid \           # Test RTB with API key
  -H "x-api-key: development-api-key-change-in-production" \
  -H "Content-Type: application/json" \
  -d '{"episode_id":"test","ad_slot":{"position":"pre_roll","duration":30}}'
curl -X POST http://localhost:3000/api/analytics/events \   # Test public endpoint
  -H "Content-Type: application/json" \
  -d '{"event_type":"impression","campaign_id":"test"}'
```

### Generate Test JWT Token
```bash
cd api-gateway
node -e "
const jwt = require('jsonwebtoken');
const token = jwt.sign(
  { id: 'test-user', email: 'test@example.com', role: 'podcaster' },
  'development-jwt-secret-key',
  { expiresIn: '1h' }
);
console.log('Bearer ' + token);
"
```

### 🛡️ Security Testing & Validation

#### Test Authentication
```bash
# Test invalid JWT (should return 401)
curl -X GET http://localhost:3000/api/podcasters \
  -H "Authorization: Bearer invalid-token"

# Test valid JWT (should route to service and fail gracefully when service unavailable)
curl -X GET http://localhost:3000/api/podcasters \
  -H "Authorization: Bearer <valid-jwt-token>"

# Test missing authentication (should return 401)
curl -X GET http://localhost:3000/api/podcasters
```

#### Test Rate Limiting
```bash
# Test general rate limiting (make multiple requests)
for i in {1..10}; do curl http://localhost:3000/health; done

# Test RTB rate limiting (high frequency requests)
for i in {1..50}; do 
  curl -X POST http://localhost:3000/api/ads/bid \
    -H "x-api-key: development-api-key-change-in-production" \
    -H "Content-Type: application/json" \
    -d '{"episode_id":"test","ad_slot":{"position":"pre_roll","duration":30}}' &
done
```

#### Test Security Features
```bash
# Test security headers
curl -I http://localhost:3000/health

# Test CORS
curl -H "Origin: https://example.com" \
  -H "Access-Control-Request-Method: GET" \
  -X OPTIONS http://localhost:3000/api/podcasters

# Test input validation (should return 400 with validation errors)
curl -X POST http://localhost:3000/api/campaigns \
  -H "Authorization: Bearer <valid-jwt>" \
  -H "Content-Type: application/json" \
  -d '{"invalid": "data"}'
```

### 🔧 Security Configuration

#### Environment-Specific Security
```bash
# Development (relaxed security)
NODE_ENV=development npm run dev:secure

# Staging (moderate security)
NODE_ENV=staging npm run dev:secure

# Production (maximum security)
NODE_ENV=production npm run start:secure
```

#### Security Environment Variables
```bash
# Required for production
export JWT_SECRET="your-super-secure-jwt-secret-key"
export API_KEY="your-production-api-key"
export REDIS_URL="redis://your-redis-server:6379"

# Optional security settings
export LOG_LEVEL="warn"                    # Production logging level
export RATE_LIMIT_WINDOW_MS="900000"      # 15 minutes
export RATE_LIMIT_MAX_REQUESTS="5000"     # Max requests per window
```


### Dashboard Development (Phase 2A Complete ✅)
```bash
cd dashboard  
npm run dev                 # Development server (Vite) → http://localhost:3001
npm run build               # Production build
npm run preview             # Preview production build

# Dashboard integrates with API Gateway at http://localhost:3000
# Includes JWT authentication, logout, role-based UI
```

### Docker Operations
```bash
# Complete Stack with Dashboard (Phase 2A Ready)
docker-compose -f docker-compose.full.yml up --build

# API Gateway only
docker-compose -f docker-compose.api-gateway.yml up --build

# Legacy operations
docker-compose up -d        # Start all services
docker-compose down         # Stop all services
docker-compose logs -f      # View logs
```

## 🔌 API Routes Quick Reference

**Complete API specification in [`stack.md`](./stack.md#%EF%B8%8F-api-gateway-routes)**

### Current Status (Phase 2A Complete - All routes + authentication)
- ✅ `/api/auth/login` - User authentication + JWT generation (public)
- ✅ `/api/podcasters` - Podcaster management (JWT)
- ✅ `/api/advertisers` - Advertiser management (JWT) 
- ✅ `/api/campaigns` - Campaign management (JWT)
- ✅ `/api/inventory` - Inventory management (JWT)
- ✅ `/api/ads/*` - RTB bidding & tracking (API key)
- ✅ `/api/analytics/*` - Event tracking (public)
- ✅ `/api/audio/*` - Dynamic ad insertion (JWT)
- ✅ `/api/rss/*` - RSS feed generation (public)

## 🔑 Environment Configuration

### API Gateway (.env)
```bash
# Basic Configuration
PORT=3000
NODE_ENV=development

# Security Configuration
JWT_SECRET=development-jwt-secret-key
API_KEY=development-api-key-change-in-production

# Redis Configuration (for rate limiting)
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=
REDIS_DB=0

# Service URLs
INVENTORY_SERVICE_URL=http://localhost:3001
ANALYTICS_SERVICE_URL=http://localhost:3002
AUDIO_SERVICE_URL=http://localhost:8081
RSS_SERVICE_URL=http://localhost:3003
RTB_ENGINE_URL=http://localhost:8080

# Security Settings
LOG_LEVEL=info
LOG_DIR=./logs
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000
```

## 🎯 Performance Results (Phase 1)

**Complete performance specifications in [`stack.md`](./stack.md#-performance-requirements--targets)**

### ✅ Security Performance Achieved
- **API Gateway routing**: 2-5ms ✅ (target: <10ms)
- **JWT Authentication**: 2-3ms ✅ (target: <5ms)  
- **Rate Limiting**: <1ms ✅ (target: <2ms)
- **Security Headers**: <0.1ms ✅
- **RTB Rate Limiting**: 10k req/s ✅

## 🧪 Testing Results Summary

**Complete testing strategy in [`stack.md`](./stack.md)**

### ✅ Phase 2A + Production Testing Results
- **Dashboard Authentication**: Login/logout flow working ✅
- **JWT Integration**: Dashboard ↔ API Gateway auth flow ✅
- **API Client**: Axios interceptors handling JWT tokens ✅
- **Role Display**: Dynamic user role display (podcaster/advertiser) ✅
- **Security**: All enterprise middleware validated with real UI ✅
- **End-to-End**: Complete platform integration verified ✅
- **TypeScript Compilation**: All middleware builds without errors ✅
- **Docker Production**: Multi-container deployment successful ✅
- **Remote Readiness**: All blocking issues resolved for deployment ✅
- **Inventory Search**: Search-on-demand with filters working ✅
- **Database Schema**: All column references fixed (owner_id → podcaster_id) ✅

### ✅ Previous Security Testing (Phase 1)
- **Authentication**: JWT validation & invalid token rejection ✅
- **Authorization**: Role-based access control ✅  
- **Rate Limiting**: Redis-powered distributed limiting ✅
- **Security Headers**: CSP, HSTS, XSS protection ✅
- **Request Validation**: Joi schemas for all endpoints ✅
- **Service Routing**: All 9 route groups working ✅

### 🔄 Automated Testing Setup
```bash
# API Gateway tests
cd api-gateway && npm test

# Security middleware tests  
cd common/middleware && npm test
```

## 📁 Key Files to Know

### 📋 Documentation (ALWAYS update together after major phases!)
- **`README.md`** - Project overview, features, quick start guide
- **`CLAUDE.md`** - **THIS FILE** - Development commands, testing, status
- **`stack.md`** - 📋 **COMPLETE ARCHITECTURE SPECIFICATION** (read this first!)

### 🛡️ Core Implementation  
- `api-gateway/src/app-secure.ts` - 🛡️ Production API Gateway with enterprise security
- `api-gateway/src/routes/auth.ts` - Authentication endpoint with JWT generation
- `api-gateway/src/routes/` - All route handlers for 9 service groups (including auth)
- `dashboard/src/services/api.ts` - API client with JWT authentication
- `dashboard/src/components/Layout.tsx` - Layout with user display and logout
- `dashboard/src/pages/Login.tsx` - Login page with role selection
- `common/middleware/` - 🛡️ Enterprise security middleware library (unified)
- `common/config/security.ts` - Environment-specific security configurations
- `docker-compose.full.yml` - Complete stack with dashboard

---

## 🚀 Phase 2A.5++ Complete - RTB Reservation System Production Ready ✅

**COMPLETED**: RTB slot reservation system fully tested and production ready
**CURRENT**: Secure two-sided marketplace with verified RTB foundation  
**NEXT**: Campaign creative management → Phase 2B - RTB Engine
**Architecture**: See [`stack.md`](./stack.md) for complete microservices roadmap

### ✅ **Major Milestones Achieved:**
- **Security Hardening**: Fixed critical auth context vulnerabilities - no more user_id parameter access
- **JWT-Only Authentication**: All routes use authenticated user context exclusively
- **RTB Production System**: Slot reservation with 60-second holds - comprehensively tested ✅
- **Floor Price Validation**: CPM minimum pricing enforced ($1.00 < $2.50 rejected)
- **Role-Based Authorization**: Only advertisers can reserve slots (supply-side protection)
- **Concurrent Bidding Support**: Multiple advertisers competing for same slots
- **Middleware Architecture**: Fixed duplicate auth causing API Gateway request failures
- **API Gateway Fix**: Proper Authorization header forwarding to inventory service
- **Production Authentication**: Database-connected auth with real user UUIDs
- **Two-Sided Marketplace**: Separate workflows for podcasters vs advertisers  
- **Business Logic Implementation**: Supply-side and demand-side correctly separated
- **Role-Based Navigation**: Different UI flows based on user role
- **Inventory Service**: Working podcast/episode/ad slot management
- **Complete Integration**: Dashboard ↔ API Gateway ↔ Database ↔ Services
- **Database Enhancements**: Slot reservations table with proper constraints and test data
- **End-to-End Testing**: Comprehensive validation of all RTB reservation scenarios

🔥🎙️ **Production-ready two-sided marketplace with fully tested RTB reservation system!**