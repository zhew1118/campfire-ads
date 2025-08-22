@echo off
echo 🔥 Testing Campfire Ads development environment setup...

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    exit /b 1
) else (
    echo ✅ Node.js is available: 
    node --version
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

REM Install backend dependencies
echo 📦 Installing backend dependencies...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install backend dependencies
    exit /b 1
)
echo ✅ Backend dependencies installed

REM Install frontend dependencies
echo 📦 Installing frontend dependencies...
cd ..\frontend
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install frontend dependencies
    exit /b 1
)
echo ✅ Frontend dependencies installed

cd ..

echo.
echo 🎉 Setup test complete! 
echo ⚠️ Note: Docker services (PostgreSQL, Redis) would need to be started separately
echo.
echo Next steps if Docker was available:
echo 1. docker-compose up -d postgres redis
echo 2. cd backend && npm run dev
echo 3. cd frontend && npm run dev
echo.
echo Happy coding! 🚀
pause