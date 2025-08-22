# Claude Code Init File - Campfire Ads

This file contains project context and commonly used commands for the Campfire Ads podcast advertising platform.

## 🎯 Project Overview

Campfire Ads is a modern podcast advertising platform built with microservices architecture. The platform connects podcasters with advertisers through real-time bidding (RTB) technology.

### Current Status: **Phase 1 Complete** ✅
- API Gateway extracted and fully functional
- All route handlers implemented according to stack.md specification
- Authentication, rate limiting, and error handling working
- Ready for Phase 2: RTB Engine and service extraction

## 🏗️ Architecture Progress

### ✅ Phase 1: API Gateway Extraction (COMPLETED)
```
campfire-ads/
├── api-gateway/           # ✅ Extracted from backend - READY
├── common/               # ✅ Shared utilities and types
├── backend/              # Legacy monolithic backend (to be extracted)
├── frontend/             # React dashboard (unchanged)
└── docker-compose.yml
```

### 🔄 Phase 2: RTB Engine (NEXT)
- Extract Go RTB engine for <10ms bid responses
- Implement gRPC communication
- Add service discovery

### 🔄 Phase 3: Complete Microservices
- Extract all remaining services from backend
- Full microservices deployment
- Production-ready orchestration

## 🛠️ Common Commands

### API Gateway Development
```bash
# Development
cd api-gateway
npm run dev                 # Start development server with hot reload
npm run build               # Build TypeScript to JavaScript  
npm start                   # Run production build
npm run typecheck           # Type checking only
npm run lint                # Code linting

# Testing API Gateway
curl http://localhost:3000/health                           # Health check
curl http://localhost:3000/api/podcasters \                # Test authenticated route
  -H "Authorization: Bearer <jwt_token>"
curl -X POST http://localhost:3000/api/ads/bid \           # Test RTB endpoint
  -H "x-api-key: development-api-key" \
  -H "Content-Type: application/json" \
  -d '{"episode_id":"test","ad_slot":{"position":"pre_roll","duration":30}}'
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

### Legacy Backend (Until Extracted)
```bash
cd backend
npm run dev                 # Development server
npm run build               # Build TypeScript
npm start                   # Production server
```

### Frontend Development
```bash
cd frontend  
npm run dev                 # Development server (Vite)
npm run build               # Production build
npm run preview             # Preview production build
```

### Docker Operations
```bash
# API Gateway with Docker
docker-compose -f docker-compose.api-gateway.yml up --build

# Full stack (legacy)
docker-compose up -d        # Start all services
docker-compose down         # Stop all services
docker-compose logs -f      # View logs
```

## 🔌 API Routes (All Implemented)

### Core Services
- `GET/POST/PUT/DELETE /api/podcasters` - Podcaster management
- `GET/POST/PUT/DELETE /api/advertisers` - Advertiser management  
- `GET/POST/PUT/DELETE /api/campaigns` - Campaign management
- `GET/POST/PUT/DELETE /api/inventory` - Inventory management

### Real-time Services  
- `POST /api/ads/bid` - RTB bidding (routes to Go RTB engine)
- `POST /api/ads/impression` - Impression tracking
- `POST /api/analytics/events` - Event tracking
- `POST /api/audio/insert` - Dynamic ad insertion

### Feed Generation
- `GET /api/rss/:podcastId` - Generate RSS with dynamic ads

## 🔑 Environment Configuration

### API Gateway (.env)
```bash
PORT=3000
JWT_SECRET=development-jwt-secret-key
API_KEY=development-api-key
INVENTORY_SERVICE_URL=http://localhost:3001
ANALYTICS_SERVICE_URL=http://localhost:3002
RTB_ENGINE_URL=http://localhost:8080
```

## 🎯 Performance Targets

- **API Gateway routing**: <10ms per request ✅  
- **RTB bid responses**: <10ms (when RTB engine implemented)
- **Event ingestion**: <5ms
- **RSS generation**: <100ms

## 🧪 Testing Strategy

### Manual Testing
1. Health check: `curl http://localhost:3000/health`
2. Authentication: Test with valid/invalid JWT tokens
3. Service routing: Test all route groups with mock responses
4. Error handling: Test with services down

### Automated Testing
```bash
# API Gateway tests (when implemented)
cd api-gateway && npm test

# Integration tests  
cd backend && npm test
```

## 📋 Next Development Steps

1. **Phase 2 Prep**: Design Go RTB engine service
2. **Service Extraction**: Move inventory service from backend to microservice
3. **gRPC Setup**: Implement high-performance service communication
4. **Service Discovery**: Add health checks and service registry
5. **Production Deploy**: Kubernetes or Docker Swarm setup

## 🚨 Known Issues & TODOs

- Docker Desktop compatibility issue (test with different Docker setup)
- JWT secret should use environment variable in production
- Add comprehensive test suite
- Implement service health checks
- Add distributed tracing (Jaeger)

## 📁 Key Files to Know

- `stack.md` - Complete architecture specification
- `api-gateway/src/app.ts` - Main API Gateway application  
- `api-gateway/src/routes/` - All route handlers
- `common/types/index.ts` - Shared TypeScript interfaces
- `docker-compose.api-gateway.yml` - API Gateway Docker setup

---

**Current Priority**: Implement Phase 2 RTB Engine for high-performance bidding

Ready to revolutionize podcast advertising! 🔥🎙️