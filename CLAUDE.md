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

### 5. **🚨 CRITICAL: Authentication Pattern** 🔐
**NEVER use individual auth middleware in service routes - use global JWT validation only!**

❌ **WRONG** - Individual auth middleware in routes:
```typescript
// DON'T DO THIS in routes/creatives.ts:
const authMiddleware = createAuthMiddleware({
  secret: process.env.JWT_SECRET
});
router.post('/', authMiddleware.validateJWT, ...)
```

✅ **CORRECT** - Rely on global auth from app.ts:
```typescript
// In app.ts (GLOBAL):
app.use('/creatives', authMiddleware.validateJWT, creativesRouter);

// In routes/creatives.ts (NO AUTH MIDDLEWARE):
router.post('/', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.id; // ✅ Available from global auth
  // Route logic here
}))
```

**Why this matters:**
- ✅ **Prevents auth conflicts** - No duplicate JWT parsing
- ✅ **Ensures ownership security** - User can only access their own data
- ✅ **Consistent patterns** - Same as campaigns, podcasts, episodes
- ❌ **Individual auth causes malformed token errors** 
- ❌ **Individual auth allows cross-user data access vulnerabilities**

**This prevents:**
- ❌ Building services that don't match Gateway expectations
- ❌ Code duplication across services  
- ❌ Inconsistent API contracts
- ❌ Missing authentication/security patterns
- ❌ Maintenance nightmare from duplicate code
- ❌ **Auth conflicts and security vulnerabilities** 🚨

## 🔄 **DOCUMENTATION UPDATE RULE**

**🚨 CRITICAL: When completing any major phase or milestone:**

1. **Update documentation files in order:**
   - `README.md` - Project overview, quick start, current features
   - `CLAUDE.md` - Development commands, testing procedures, current status  
   - `stack.md` - Architecture progress, phase completion, performance results (DO NOT COMMIT)

2. **Update content consistently across files:**
   - ✅ Mark completed phases and features
   - 🔄 Update "Next" sections and roadmap
   - 📊 Add performance results and testing outcomes
   - 🏗️ Reflect current project structure

3. **Commit documentation updates together:**
   - Create single commit with README.md and CLAUDE.md updates ONLY
   - DO NOT commit stack.md changes (keep local for reference)
   - Use descriptive commit message explaining what was completed
   - Ensure future Claude sessions get accurate project state

**This ensures documentation stays synchronized and Claude sessions have accurate context.**

## 🎯 Current Status: **Phase 2B Database Migration + Creative Management Complete** ✅

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
- ✅ **Campaign Creative Management**: Complete CRUD system for creative assets (images, audio, video)
- ✅ **File Upload & Storage**: Multer integration with validation, storage, and download
- ✅ **Creative Validation**: MIME type detection with file extension fallback for robust validation
- ✅ **File Management**: Upload (500MB limit), download with proper headers, metadata management
- ✅ **Security & Permissions**: JWT-protected endpoints with campaign ownership validation
- ✅ **Docker Integration**: Fixed upload directory permissions for nodejs user in containers
- ✅ **Route Ordering Fix**: Resolved creative route conflicts by proper mounting order
- ✅ **Database Schema**: campaign_creatives table with foreign keys, metadata, audit fields
- ✅ **Production Testing**: Full upload/download cycle tested with MP3 file successfully
- ✅ **DELETE/DETACH Operations**: Fixed route ordering and validation conflicts - all CRUD operations working
- ✅ **End-to-End Testing**: Complete creative management workflow validated through API Gateway
- ✅ **Database Integrity**: Campaign-creative associations properly managed with foreign key constraints
- ✅ **Campaign-Creative Updates**: New PUT endpoint for updating association metadata (weight, position, notes)
- ✅ **Enhanced Audio Metadata**: Bitrate, sample rate, LUFS levels, transcript URLs working
- ✅ **Status Lifecycle**: Draft → In Review → Approved → Rejected → Archived workflow implemented
- ✅ **Database Testing**: All CRUD operations validated with real database constraints and user IDs
- ✅ **Production Testing**: All uncommitted changes tested and confirmed working in Docker environment

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

## 🚀 **Phase 2A.5++++ Complete - Creative Management Production Ready** ✅

### **Creative Management System Fully Implemented:**

**📈 Campaign Creatives Management - ALL COMPLETE**
- ✅ **Global Creative Library**: Advertiser-owned creative assets with full metadata
- ✅ **Campaign-Creative Associations**: Many-to-many relationships for creative reuse  
- ✅ **File Upload & Storage**: Multipart form data with 500MB limit and validation
- ✅ **Creative Validation**: MIME type detection, file extension validation, size limits
- ✅ **Complete CRUD Operations**: Create, read, update, delete for both creatives and associations
- ✅ **Database Schema**: Proper foreign keys, constraints, and audit fields
- ✅ **Route Architecture**: Fixed ordering conflicts and validation patterns
- ✅ **API Integration**: Working through both direct service and API Gateway
- ✅ **Production Testing**: End-to-end validation of all operations

### **Creative Management API Endpoints - ALL WORKING** ✅

```
✅ Global Creative Library
  POST   /api/creatives              # Upload new creative to advertiser's library
  GET    /api/creatives              # List advertiser's creative library (paginated)
  GET    /api/creatives/:id          # Get creative details
  GET    /api/creatives/:id/download # Download creative file
  PUT    /api/creatives/:id          # Update creative metadata
  DELETE /api/creatives/:id          # Delete creative from library

✅ Campaign-Creative Associations  
  POST   /api/campaigns/:id/creatives          # Assign existing creative(s) to campaign
  GET    /api/campaigns/:id/creatives          # List creatives assigned to campaign
  DELETE /api/campaigns/:id/creatives/:id      # Detach creative from campaign
```

## 🚀 **Phase 2B Database Migration Complete - Backward Compatible** ✅

### **Database Schema Enhancement Completed:**

**📊 Migration 04 - Pre-Phase 2B Improvements - ALL COMPLETE**
- ✅ **Backward Compatibility**: Keeps existing `is_approved` and `rejection_reason` columns  
- ✅ **New Status Lifecycle**: Added `status` column with CHECK constraint (draft/in_review/approved/rejected/archived)
- ✅ **Audio Metadata**: Added `audio_bitrate_kbps`, `audio_sample_rate_hz`, `audio_channels`, `lufs_integrated`, `transcript_url`
- ✅ **CDN Integration**: Added `cdn_url` and `version` columns for content delivery
- ✅ **Campaign Enhancements**: Added `weight`, `flight_start/end`, `position`, `frequency_cap_per_episode`, `notes`
- ✅ **Tracking Tables**: Created `placements`, `impressions_raw`, `host_reports` for Phase 2B
- ✅ **Data Migration**: Migrated `is_approved` → `status` while preserving legacy column
- ✅ **Performance Indexes**: Added indexes for advertiser, campaign-creative relationships
- ✅ **Production Testing**: API fully functional after migration - no breaking changes

### **Migration Results - Zero Downtime Deployment:**
```json
// API response shows both legacy and new columns working
{
  "is_approved": true,           // Legacy column (kept)
  "status": "approved",          // New status lifecycle  
  "cdn_url": "https://cdn.onecampfire.media/uploads/...",
  "version": 1,
  "audio_bitrate_kbps": 128,     // Audio metadata
  "lufs_integrated": "-16.00"    // Loudness standards
}
```

**✅ Zero Breaking Changes:**
- ✅ **Existing API**: All current endpoints work unchanged
- ✅ **Legacy Support**: `is_approved` boolean still functional
- ✅ **Gradual Migration**: Can migrate to `status` column over time
- ✅ **Docker Production**: All containers healthy and functional

## 🚀 **Next Priority: Phase 2B - Tracking Service Implementation** 🔄

**COMPLETED** Phase 2A.5++++ - Creative Management Production Ready ✅  
**NEXT** (Phase 2B) - Tracking service for immediate revenue generation:

### **🎯 Strategic Pivot Rationale:**
- ✅ **Immediate Revenue**: Start billing from day 1 with verified impressions
- ✅ **No Migration Required**: Works with existing podcast infrastructure
- ✅ **IAB Compliance**: Industry-standard tracking methodology  
- ✅ **Progressive Enhancement**: Three verification tiers (verified → prefix → host-reported)
- ✅ **Builds on Foundation**: Uses existing creative management + campaign system

### **Phase 2B: Tracking Service Implementation Plan**

**Based on tracking-service.md specification:**

1. **Database Schema (New Tables)**
   ```sql
   placements(
     id UUID PK,
     slot_id UUID,
     campaign_id UUID,
     creative_id UUID,
     verification_tier TEXT CHECK (verification_tier IN ('ONECAMPFIRE_VERIFIED','HOST_VERIFIED','PREFIX')),
     tracking_key TEXT UNIQUE,
     created_at TIMESTAMPTZ
   )
   
   impressions_raw(
     id BIGSERIAL PK,
     ts TIMESTAMPTZ,
     ip_hash TEXT, ua_hash TEXT,
     status INT, method TEXT,
     range_start BIGINT, range_end BIGINT, bytes_sent BIGINT,
     placement_id UUID, campaign_id UUID, creative_id UUID, slot_id UUID, episode_id UUID, podcast_id UUID,
     referrer_host TEXT, user_agent TEXT
   )
   
   host_reports(
     id BIGSERIAL PK,
     placement_id UUID,
     source_host TEXT, evidence_url TEXT,
     period_start DATE, period_end DATE,
     downloads INT,
     created_at TIMESTAMPTZ
   )
   ```

2. **Tracking Infrastructure**
   - **Redirect URL tracking**: `GET /i/{trackingKey}.mp3` with IAB-style logging
   - **Prefix mode**: `GET /prefix?url=<episode-url>` for episode-level tracking
   - **Host-verified fallback**: Manual reporting via `POST /api/host-reports`

3. **End-to-End Workflows**
   - **ONECAMPFIRE_VERIFIED**: Podcaster pastes tracking URL → server logs → 302 to creative
   - **PREFIX**: Episode-level tracking via feed wrapper
   - **HOST_VERIFIED**: Download creative → manual stats reporting

4. **Analytics & Billing**
   - IAB-compliant deduplication (IP+UA within 24h)
   - Qualified impression thresholds by bytes/Range
   - Automated billing: qualified impressions × CPM

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

### **Phase 3A: RTB Engine (Moved from 2B)** 📅
- **RTB Engine**: High-performance Go + gRPC bidding system  
- **Service Extraction**: Microservices for analytics, audio processing
- **Performance**: Sub-10ms RTB responses, 10k+ req/s capability
- **Rationale**: Build revenue-generating tracking service first, then optimize with RTB

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

#### 🚨 **CRITICAL: JWT Requirements for Docker Testing** 
The JWT token MUST include ALL required claims that the middleware expects:

- ✅ **Secret**: Use `production-jwt-secret-change-this` for Docker containers
- ✅ **Issuer**: Must be `campfire-ads` 
- ✅ **Audience**: Must be `campfire-ads-api`
- ✅ **User Claims**: `id`, `email`, `role` (`podcaster` | `advertiser` | `admin`)

#### Development (Local Services)
```bash
cd api-gateway
node -e "
const jwt = require('jsonwebtoken');
const token = jwt.sign(
  { id: 'test-user', email: 'test@example.com', role: 'podcaster' },
  'development-jwt-secret-key',
  { expiresIn: '1h', issuer: 'campfire-ads', audience: 'campfire-ads-api' }
);
console.log('Bearer ' + token);
"
```

#### Docker Testing (Production Containers)
```bash
cd api-gateway
# Advertiser token for testing campaigns/creatives
node -e "
const jwt = require('jsonwebtoken');
const token = jwt.sign(
  { id: 'f7e8d9c0-1234-5678-9abc-def012345678', email: 'advertiser@example.com', role: 'advertiser' },
  'production-jwt-secret-change-this',
  { expiresIn: '1h', issuer: 'campfire-ads', audience: 'campfire-ads-api' }
);
console.log(token);
"

# Podcaster token for testing podcasts/episodes/slots  
node -e "
const jwt = require('jsonwebtoken');
const token = jwt.sign(
  { id: '123e4567-e89b-12d3-a456-426614174000', email: 'test@example.com', role: 'podcaster' },
  'production-jwt-secret-change-this',
  { expiresIn: '1h', issuer: 'campfire-ads', audience: 'campfire-ads-api' }
);
console.log(token);
"
```

#### ⚠️ Common JWT Errors:
- ❌ **"Malformed token"**: Missing `issuer` or `audience` claims
- ❌ **"Authentication required"**: Missing `Authorization: Bearer ` header
- ❌ **"Invalid token"**: Wrong secret (dev vs production)
- ❌ **"Token expired"**: Generate new token (1h expiry)

### 🧪 **CRUD Testing Commands (Docker)**

**First generate tokens using the Docker JWT commands above, then:**

#### Campaigns CRUD Testing
```bash
# Set your advertiser JWT token
JWT_TOKEN="eyJhbGc..."  # Use advertiser token from above

# Test GET campaigns (requires pagination params)
curl -X GET "http://localhost:3004/campaigns?page=1&limit=10&sort=desc&sortBy=created_at" \
  -H "Authorization: Bearer $JWT_TOKEN"

# Test POST campaign (create)
curl -X POST "http://localhost:3004/campaigns" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Campaign", 
    "budget_cents": 100000, 
    "max_bid_cents": 250, 
    "start_date": "2025-01-01", 
    "end_date": "2025-12-31", 
    "targeting": {}, 
    "bid_strategy": "cpm"
  }'

# Test PUT campaign (update) - use campaign ID from POST response
curl -X PUT "http://localhost:3004/campaigns/{CAMPAIGN_ID}" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Updated Campaign Name"}'

# Test DELETE campaign  
curl -X DELETE "http://localhost:3004/campaigns/{CAMPAIGN_ID}" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

#### Creatives CRUD Testing  
```bash
# Test GET creatives (paginated)
curl -X GET "http://localhost:3004/creatives?page=1&limit=10&sort=desc&sortBy=created_at" \
  -H "Authorization: Bearer $JWT_TOKEN"

# Test POST creative (upload) - requires multipart/form-data
curl -X POST "http://localhost:3004/creatives" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -F "file=@test-audio.mp3" \
  -F "name=Test Creative" \
  -F "creative_type=audio" \
  -F "duration=30"

# Test GET creative by ID
curl -X GET "http://localhost:3004/creatives/{CREATIVE_ID}" \
  -H "Authorization: Bearer $JWT_TOKEN"

# Test creative download
curl -X GET "http://localhost:3004/creatives/{CREATIVE_ID}/download" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  --output downloaded-creative.mp3

# Test PUT creative (update metadata)
curl -X PUT "http://localhost:3004/creatives/{CREATIVE_ID}" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Creative Name",
    "audio_bitrate_kbps": 128,
    "lufs_integrated": -16.0,
    "status": "approved"
  }'

# Test DELETE creative
curl -X DELETE "http://localhost:3004/creatives/{CREATIVE_ID}" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

#### Campaign-Creative Associations CRUD
```bash
# Test POST campaign-creative assignment (enhanced with metadata)
curl -X POST "http://localhost:3004/campaigns/{CAMPAIGN_ID}/creatives" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "creative_ids": ["creative-uuid-1", "creative-uuid-2"],
    "weight": 100,
    "flight_start": "2025-01-01T00:00:00Z",
    "flight_end": "2025-12-31T23:59:59Z", 
    "position": "pre_roll",
    "frequency_cap_per_episode": 1,
    "notes": "Primary creative for Q1 campaign"
  }'

# Test GET campaign creatives
curl -X GET "http://localhost:3004/campaigns/{CAMPAIGN_ID}/creatives" \
  -H "Authorization: Bearer $JWT_TOKEN"

# Test PUT campaign-creative association update (NEW ENDPOINT)
curl -X PUT "http://localhost:3004/campaigns/{CAMPAIGN_ID}/creatives/{CREATIVE_ID}" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "weight": 150,
    "position": "mid_roll",
    "notes": "Updated to mid-roll placement"
  }'

# Test DELETE campaign-creative detachment
curl -X DELETE "http://localhost:3004/campaigns/{CAMPAIGN_ID}/creatives/{CREATIVE_ID}" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

#### Direct Service vs API Gateway Testing
```bash
# Direct to inventory service (port 3004)
curl -X GET "http://localhost:3004/campaigns?page=1&limit=10&sort=desc&sortBy=created_at" \
  -H "Authorization: Bearer $JWT_TOKEN"

# Through API Gateway (port 3000) 
curl -X GET "http://localhost:3000/api/campaigns?page=1&limit=10&sort=desc&sortBy=created_at" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

### 🗄️ **Database Testing & Real User IDs**

#### Check Real User IDs in Database
```bash
# Check existing advertiser IDs for JWT generation
docker exec campfire-ads-postgres-1 psql -U campfire_user -d campfire_ads \
  -c "SELECT id, email, role FROM users WHERE role = 'advertiser' LIMIT 3;"

# Check existing podcaster IDs  
docker exec campfire-ads-postgres-1 psql -U campfire_user -d campfire_ads \
  -c "SELECT id, email, role FROM users WHERE role = 'podcaster' LIMIT 3;"
```

#### Generate JWT with Real Database User IDs
```bash
cd api-gateway

# Real advertiser from database (for campaigns/creatives testing)
node -e "
const jwt = require('jsonwebtoken');
const token = jwt.sign(
  { id: '550e8400-e29b-41d4-a716-446655440001', email: 'advertiser@example.com', role: 'advertiser' },
  'production-jwt-secret-change-this',
  { expiresIn: '1h', issuer: 'campfire-ads', audience: 'campfire-ads-api' }
);
console.log(token);
"

# Real podcaster from database (for podcasts/episodes/slots testing)
node -e "
const jwt = require('jsonwebtoken');
const token = jwt.sign(
  { id: '123e4567-e89b-12d3-a456-426614174000', email: 'test@example.com', role: 'podcaster' },
  'production-jwt-secret-change-this',
  { expiresIn: '1h', issuer: 'campfire-ads', audience: 'campfire-ads-api' }
);
console.log(token);
"
```

#### Database Schema Validation  
```bash
# Check new migration fields are working
docker exec campfire-ads-postgres-1 psql -U campfire_user -d campfire_ads \
  -c "SELECT status, lufs_integrated, cdn_url, version FROM creatives LIMIT 3;"

# Check campaign-creative associations metadata
docker exec campfire-ads-postgres-1 psql -U campfire_user -d campfire_ads \
  -c "SELECT weight, position, frequency_cap_per_episode, notes FROM campaign_creatives LIMIT 3;"
```

### 🧪 **Validated Test Results (Aug 2025)**

**✅ All CRUD operations tested and working:**
- **Campaigns**: GET (pagination), POST, PUT, DELETE - all working
- **Creatives**: GET, POST (file upload), PUT (metadata), DELETE, download - all working  
- **Campaign-Creative Associations**: POST (with metadata), GET, PUT (NEW), DELETE - all working
- **API Gateway Integration**: All endpoints accessible through both direct (3004) and gateway (3000)
- **Database Migration**: All new fields working (status, lufs_integrated, cdn_url, version)
- **JWT Authentication**: Working with proper issuer/audience claims
- **Real Database**: Foreign key constraints enforced, real user IDs required

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

**COMPLETED**: Creative management system with enhanced metadata and database migration
**CURRENT**: Production-ready two-sided marketplace with complete CRUD operations
**NEXT**: Phase 2B - Tracking Service for impression tracking and billing automation
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