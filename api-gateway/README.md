# Campfire Ads API Gateway

The API Gateway serves as the entry point for all client requests and routes them to appropriate microservices.

## Features

- **Centralized Routing**: Routes requests to inventory, analytics, audio, RSS, and RTB services
- **Authentication**: JWT-based authentication for user requests and API key validation for service-to-service communication
- **Rate Limiting**: Configurable rate limiting to prevent abuse
- **Request Logging**: Comprehensive request/response logging
- **Error Handling**: Standardized error responses across all endpoints
- **Health Checks**: Built-in health check endpoint for monitoring

## Routes

### Core Services
- `/api/podcasters` - Podcaster account management
- `/api/advertisers` - Advertiser account management  
- `/api/campaigns` - Campaign creation and management
- `/api/inventory` - Podcast episode and ad slot inventory

### Real-time Services
- `/api/ads` - Real-time bidding and ad serving
- `/api/analytics` - Event tracking and reporting
- `/api/audio` - Dynamic ad insertion processing
- `/api/rss` - RSS feed generation with dynamic ads

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy environment configuration:
   ```bash
   cp .env.example .env
   ```

3. Configure environment variables in `.env`

4. Start development server:
   ```bash
   npm run dev
   ```

5. Build for production:
   ```bash
   npm run build
   npm start
   ```

## Environment Variables

- `PORT` - Server port (default: 3000)
- `JWT_SECRET` - Secret key for JWT token verification
- `API_KEY` - API key for service-to-service authentication
- Service URLs for routing requests to backend services

## Health Check

The API Gateway exposes a health check endpoint at `/health` that returns:
- Service status
- Current timestamp
- Version information

## Performance Targets

- **Routing latency**: <10ms per request
- **Throughput**: 5,000+ requests per second
- **Availability**: 99.9% uptime