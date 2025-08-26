#!/bin/bash
# Restore database to clean baseline (equivalent to migrations 01-03 with test data)
# Usage: ./restore_clean_baseline.sh

echo "🗄️  Restoring database to clean baseline..."

# Restore from dump file
cd "$(dirname "$0")"
cat 00_clean_baseline.sql | docker exec -i campfire-ads-postgres-1 psql -U campfire_user -d campfire_ads

echo "✅ Database restored to clean baseline state"
echo ""
echo "📋 Available test data:"
echo "   👤 Users: 4 (2 podcasters + 2 advertisers)"
echo "   🎙️  Podcasts: 4"  
echo "   📻 Episodes: 4"
echo "   📍 Ad Slots: 7"
echo "   📈 Campaigns: 2"
echo "   🎨 Creatives: 5"
echo "   🔗 Campaign-Creative Links: 5"
echo ""
echo "🔐 Test credentials:"
echo "   Podcaster: test@example.com / password123"
echo "   Advertiser: advertiser@example.com / password123"