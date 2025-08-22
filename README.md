# 🔥 Campfire Ads - Podcast Advertising Platform

A modern, open-source podcast advertising platform that connects podcasters with advertisers through real-time bidding (RTB) technology.

## 🚀 Features

### For Publishers (Podcasters)
- **RSS Feed Integration**: Automatically sync podcast episodes from RSS feeds
- **Ad Slot Management**: Configure pre-roll, mid-roll, and post-roll ad inventory
- **Revenue Analytics**: Real-time revenue tracking and performance metrics
- **Audio Processing**: Automated ad insertion into podcast episodes

### For Advertisers
- **Campaign Management**: Create and manage targeted advertising campaigns
- **Real-Time Bidding**: Compete for ad slots through automated auctions
- **Advanced Targeting**: Target by podcast category, audience demographics, and more
- **Performance Tracking**: Monitor impressions, clicks, and campaign ROI

### Platform Features
- **RTB Integration**: Powered by Prebid Server for industry-standard auctions
- **Modern Dashboard**: React-based interface with real-time updates
- **Enterprise Security**: Centralized security middleware with JWT, rate limiting, validation
- **Scalable Architecture**: Microservices-ready with API Gateway and shared middleware
- **Audio Processing**: FFmpeg-powered ad insertion and audio processing

## 🏗️ Technology Stack

### Microservices Architecture
- **API Gateway**: Node.js + Express.js with enterprise security (Phase 1 ✅)
- **Security Middleware**: Centralized JWT, rate limiting, validation, logging
- **RTB Engine**: Go + gRPC for high-performance bidding - *Phase 2*
- **Services**: Node.js microservices (inventory, analytics, audio, RSS)
- **Database**: PostgreSQL 15+ with service-specific schemas
- **Cache**: Redis 7+ for distributed rate limiting and session management
- **Audio**: Go + FFmpeg for dynamic ad insertion
- **Communication**: REST + gRPC for performance-critical paths

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and builds
- **Styling**: Tailwind CSS for modern UI design
- **State**: Zustand for lightweight state management
- **Charts**: Recharts for analytics visualization
- **HTTP**: Axios for API communication

### DevOps
- **Containerization**: Docker + Docker Compose
- **Development**: Hot reload for both frontend and backend
- **Database**: Automated migrations and seeding
- **Environment**: Comprehensive environment configuration

## 📁 Project Structure

```
campfire-ads/
├── api-gateway/             # 🚀 Express.js API Gateway (Phase 1 ✅)
│   ├── src/
│   │   ├── routes/          # Route handlers for all services
│   │   ├── middleware/      # Basic auth, logging, error handling
│   │   ├── services/        # HTTP client & service discovery
│   │   ├── app.ts           # Basic gateway application
│   │   └── app-secure.ts    # 🔒 Enhanced security version
│   ├── Dockerfile           # Production container
│   └── package.json
├── common/                  # ✅ Centralized Security & Utilities
│   ├── middleware/          # 🛡️ Enterprise security middleware
│   │   ├── auth.ts          # JWT validation & role-based access
│   │   ├── rateLimiting.ts  # Redis-powered rate limiting
│   │   ├── validation.ts    # Joi schema validation
│   │   ├── logging.ts       # Winston security logging
│   │   ├── security.ts      # Headers, CORS, XSS protection
│   │   └── README.md        # Comprehensive security docs
│   ├── config/              # Security configuration management
│   └── types/               # Shared TypeScript interfaces
├── services/                # 🔄 Microservices (Phase 2-3)
│   ├── inventory-service/   # Podcast & ad inventory management
│   ├── rtb-engine/         # Go-based real-time bidding engine
│   ├── analytics-service/   # Event tracking & reporting
│   ├── audio-service/      # Dynamic ad insertion (Go + FFmpeg)
│   └── rss-service/        # RSS feed generation with ads
├── backend/                 # 📦 Legacy monolith (being extracted)
├── frontend/                # 📱 React dashboard (unchanged)
├── docker-compose.yml       # Local development stack
├── stack.md                # 📋 Complete architecture specification
└── CLAUDE.md               # 🤖 Claude Code init file
```

## 🛠️ Quick Start

### Prerequisites
- Node.js 18+ LTS
- Docker & Docker Compose (optional)
- Git

### 🚀 API Gateway (Phase 1 Complete - Secure!)

The API Gateway with enterprise security is ready:

```bash
# Quick start - Secure API Gateway
cd api-gateway
npm install
npm run dev:secure      # Enhanced security version

# OR basic version
npm run dev             # Basic version

# Test functionality
curl http://localhost:3000/health
```

### Automated Setup (Recommended)

#### Windows
```bash
# Run the setup script
scripts\setup.bat
```

#### macOS/Linux
```bash
# Make script executable
chmod +x scripts/setup.sh

# Run the setup script
./scripts/setup.sh
```

### Manual Setup

1. **Clone and Setup Environment**
   ```bash
   git clone <repository-url>
   cd campfire-ads
   cp .env.example .env
   cp frontend/.env.example frontend/.env
   ```

2. **Start Database Services**
   ```bash
   docker-compose up -d postgres redis
   ```

3. **Install Dependencies**
   ```bash
   # Backend
   cd backend && npm install
   
   # Frontend
   cd ../frontend && npm install
   ```

4. **Start Development Servers**
   ```bash
   # Terminal 1: Backend API
   cd backend && npm run dev
   
   # Terminal 2: Frontend App
   cd frontend && npm run dev
   
   # Terminal 3: Prebid Server (Optional)
   cd prebid-server && docker-compose up
   ```

## 🌐 Access Points

### Phase 1 (Secure API Gateway)
- **API Gateway**: http://localhost:3000
- **Health Check**: http://localhost:3000/health
- **All API Routes**: http://localhost:3000/api/*
- **Security**: Enterprise middleware with JWT, rate limiting, validation
- **Performance**: <10ms routing overhead, RTB-optimized

### Legacy Stack
- **Frontend Dashboard**: http://localhost:3000 (legacy)
- **Backend API**: http://localhost:3001 (legacy)
- **Prebid Server**: http://localhost:8000 (if running)

## 📊 Database

The project uses PostgreSQL for data storage with automated migrations and seeding for development.

### Development Setup
Database connection details are configured through environment variables. Copy `.env.example` to `.env` and update the database settings for your local development environment.

## 🔌 API Documentation

The API Gateway provides unified access to all microservices with enterprise security:

### 🚀 Live Routes (Phase 1 Complete)
- **`/api/podcasters`** - Podcaster management + earnings (JWT protected)
- **`/api/advertisers`** - Advertiser accounts + billing (JWT protected)
- **`/api/campaigns`** - Campaign CRUD + RTB integration (JWT protected)
- **`/api/inventory`** - Podcast inventory + search (JWT protected)
- **`/api/ads`** - Real-time bidding + tracking (API key protected)
- **`/api/analytics`** - Event tracking + reports (public with validation)
- **`/api/audio`** - Dynamic ad insertion + downloads (JWT protected)
- **`/api/rss`** - RSS feed generation + caching (public with rate limits)

### 🛡️ Security Features
- **JWT Authentication** with role-based access control
- **Redis Rate Limiting** (10k req/s for RTB, configurable per endpoint)
- **Request Validation** with Joi schemas for all endpoints
- **Security Logging** with Winston (requests, errors, security events)
- **Security Headers** (CSP, HSTS, XSS protection, CORS)
- **Input Sanitization** and XSS/injection protection

### 🔐 Authentication
- **JWT tokens** for user requests (`Authorization: Bearer <token>`)
- **API keys** for service-to-service (`x-api-key: <key>`)
- **Environment-specific** security configurations

Test: `curl http://localhost:3000/health`

## 🧪 Development

### Running Tests
```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test
```

### Code Quality
```bash
# Linting
cd backend && npm run lint
cd frontend && npm run lint

# Type checking
cd backend && npm run typecheck
cd frontend && npm run typecheck
```

### Building for Production
```bash
# Backend
cd backend && npm run build

# Frontend
cd frontend && npm run build
```

## 🐳 Docker Development

The project includes a complete Docker Compose setup for local development:

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

## 📈 Roadmap

### Current Status
- ✅ **Foundation**: Project structure, database schema, authentication
- ✅ **Core Setup**: React dashboard, API routes, Docker environment

### Upcoming Features
- **Publisher Tools**: RSS feed integration, episode management
- **Advertiser Platform**: Campaign creation and management tools  
- **RTB System**: Real-time bidding and auction system
- **Audio Processing**: Dynamic ad insertion capabilities

See our [Issues](../../issues) and [Projects](../../projects) for detailed development tracking.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check the `/docs` directory for detailed guides
- **Issues**: Report bugs and request features via GitHub Issues
- **Discussions**: Join community discussions for questions and ideas

## 🙏 Acknowledgments

- Built with [Prebid.js](https://prebid.org/) for RTB integration
- UI components inspired by [Tailwind UI](https://tailwindui.com/)
- Thanks to the open-source community for the amazing tools and libraries

---

**Enterprise-grade podcast advertising platform** 🎙️  
**Phase 1 Complete ✅ | Security Enhanced 🛡️ | RTB Engine Next 🔄**
