#!/bin/bash

# Campfire Ads Development Setup Script

echo "🔥 Setting up Campfire Ads development environment..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18 or higher is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Prerequisites check passed"

# Copy environment files
echo "📝 Setting up environment files..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ Created backend .env file"
else
    echo "⚠️  Backend .env file already exists"
fi

if [ ! -f frontend/.env ]; then
    cp frontend/.env.example frontend/.env
    echo "✅ Created frontend .env file"
else
    echo "⚠️  Frontend .env file already exists"
fi

# Start database services
echo "🐳 Starting database services..."
docker-compose up -d postgres redis

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
until docker-compose exec postgres pg_isready -U campfire_user -d campfire_ads; do
    sleep 2
done
echo "✅ PostgreSQL is ready"

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
echo "✅ Backend dependencies installed"

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd ../frontend
npm install
echo "✅ Frontend dependencies installed"

cd ..

echo ""
echo "🎉 Setup complete! Next steps:"
echo ""
echo "1. Start the development servers:"
echo "   # Terminal 1 (Backend):"
echo "   cd backend && npm run dev"
echo ""
echo "   # Terminal 2 (Frontend):"
echo "   cd frontend && npm run dev"
echo ""
echo "   # Terminal 3 (Prebid Server - Optional):"
echo "   cd prebid-server && docker-compose up"
echo ""
echo "2. Visit the application:"
echo "   - Frontend: http://localhost:3000"
echo "   - Backend API: http://localhost:3001"
echo "   - Health Check: http://localhost:3001/api/health"
echo ""
echo "3. Database is available at localhost:5432"
echo "   - Database: campfire_ads"
echo "   - User: campfire_user"
echo "   - Password: campfire_password"
echo ""
echo "Happy coding! 🚀"