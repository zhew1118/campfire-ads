@echo off
echo 🔥 Setting up Campfire Ads development environment...

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not installed. Please install Docker first.
    exit /b 1
)

docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Compose is not installed. Please install Docker Compose first.
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    exit /b 1
)

echo ✅ Prerequisites check passed

REM Copy environment files
echo 📝 Setting up environment files...
if not exist .env (
    copy .env.example .env
    echo ✅ Created backend .env file
) else (
    echo ⚠️ Backend .env file already exists
)

if not exist frontend\.env (
    copy frontend\.env.example frontend\.env
    echo ✅ Created frontend .env file
) else (
    echo ⚠️ Frontend .env file already exists
)

REM Start database services
echo 🐳 Starting database services...
docker-compose up -d postgres redis

REM Wait for services to be ready
echo ⏳ Waiting for services to be ready...
timeout /t 10 /nobreak >nul

REM Install backend dependencies
echo 📦 Installing backend dependencies...
cd backend
call npm install
echo ✅ Backend dependencies installed

REM Install frontend dependencies
echo 📦 Installing frontend dependencies...
cd ..\frontend
call npm install
echo ✅ Frontend dependencies installed

cd ..

echo.
echo 🎉 Setup complete! Next steps:
echo.
echo 1. Start the development servers:
echo    # Terminal 1 (Backend):
echo    cd backend && npm run dev
echo.
echo    # Terminal 2 (Frontend):
echo    cd frontend && npm run dev
echo.
echo    # Terminal 3 (Prebid Server - Optional):
echo    cd prebid-server && docker-compose up
echo.
echo 2. Visit the application:
echo    - Frontend: http://localhost:3000
echo    - Backend API: http://localhost:3001
echo    - Health Check: http://localhost:3001/api/health
echo.
echo 3. Database is available at localhost:5432
echo    - Database: campfire_ads
echo    - User: campfire_user
echo    - Password: campfire_password
echo.
echo Happy coding! 🚀
pause