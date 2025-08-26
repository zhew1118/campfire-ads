@echo off
REM Restore database to clean baseline (equivalent to migrations 01-03 with test data)
REM Usage: restore_clean_baseline.bat

echo 🗄️  Restoring database to clean baseline...

REM Change to script directory
cd /d "%~dp0"

REM Restore from dump file
type 00_clean_baseline.sql | docker exec -i campfire-ads-postgres-1 psql -U campfire_user -d campfire_ads

echo ✅ Database restored to clean baseline state
echo.
echo 📋 Available test data:
echo    👤 Users: 4 (2 podcasters + 2 advertisers)
echo    🎙️  Podcasts: 4
echo    📻 Episodes: 4  
echo    📍 Ad Slots: 7
echo    📈 Campaigns: 2
echo    🎨 Creatives: 5
echo    🔗 Campaign-Creative Links: 5
echo.
echo 🔐 Test credentials:
echo    Podcaster: test@example.com / password123
echo    Advertiser: advertiser@example.com / password123