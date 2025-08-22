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
- **Scalable Architecture**: Built with Node.js, PostgreSQL, and Redis
- **Audio Processing**: FFmpeg-powered ad insertion and audio processing

## 🏗️ Technology Stack

### Backend
- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: Express.js with comprehensive middleware
- **Database**: PostgreSQL 15+ for relational data
- **Cache**: Redis 7+ for session and bid caching
- **Audio**: FFmpeg + fluent-ffmpeg for audio processing
- **RTB**: Prebid Server (Go) for real-time bidding

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
├── backend/                 # Node.js API server
│   ├── src/
│   │   ├── controllers/     # Route handlers
│   │   ├── middleware/      # Auth, validation, etc.
│   │   ├── models/          # Database models
│   │   ├── services/        # Business logic
│   │   ├── routes/          # API routes
│   │   ├── utils/           # Helper functions
│   │   └── app.ts           # Express app setup
│   ├── config/              # Database config & migrations
│   └── package.json
├── frontend/                # React dashboard
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Route components
│   │   ├── services/        # API client functions
│   │   └── App.tsx
│   └── package.json
├── prebid-server/           # Prebid Server config
├── scripts/                 # Setup and utility scripts
├── docker-compose.yml       # Local development stack
└── README.md
```

## 🛠️ Quick Start

### Prerequisites
- Node.js 18+ LTS
- Docker & Docker Compose
- Git

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

- **Frontend Dashboard**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Health Check**: http://localhost:3001/api/health
- **Prebid Server**: http://localhost:8000 (if running)

## 📊 Database

The project uses PostgreSQL for data storage with automated migrations and seeding for development.

### Development Setup
Database connection details are configured through environment variables. Copy `.env.example` to `.env` and update the database settings for your local development environment.

## 🔌 API Documentation

The platform provides RESTful APIs for:

- **Authentication**: User registration, login, and session management
- **Publisher Management**: Podcast and episode management
- **Campaign Management**: Ad campaign creation and control  
- **Analytics**: Performance tracking and reporting
- **RTB Integration**: Real-time bidding endpoints
- **Audio Processing**: Dynamic ad insertion services

Detailed API documentation is available after starting the development server at `http://localhost:3001/api/docs`.

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

**Open-source podcast advertising platform** 🎙️
