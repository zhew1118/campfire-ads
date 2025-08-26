# Database Migrations

## 🚀 Quick Start (Recommended)

For development, use the baseline dump instead of running individual migrations:

```bash
# Windows
restore_clean_baseline.bat

# Linux/Mac
./restore_clean_baseline.sh
```

This restores the database to the equivalent of migrations 01-03 with all test data.

## 📁 File Structure

### Current Migrations
- `00_clean_baseline.sql` - **Database dump** (equivalent to migrations 01-03 + test data)
- `04_pre_phase2B_improvements.sql` - Phase 2B enhancements (when ready)
- `05_status_lifecycle.sql` - Status migration (when ready)

### Archive (Reference Only)
- `archive/01_initial_schema.sql` - Original schema creation
- `archive/02_campaign_creatives.sql` - Creative management system  
- `archive/03_refactor_creatives_architecture.sql` - Creative architecture refactor

## 🎯 Development Workflow

1. **Start Clean**: Run `restore_clean_baseline.bat/sh`
2. **Develop**: Create new migrations (04, 05, etc.)
3. **Test**: Run your new migrations on the clean baseline
4. **Reset**: Use baseline restore anytime to get back to clean state

## 📊 Test Data Included

The baseline includes:
- 👤 **4 Users**: 2 podcasters + 2 advertisers  
- 🎙️ **4 Podcasts**: Sample podcast data
- 📻 **4 Episodes**: Connected to podcasts
- 📍 **7 Ad Slots**: Pre/mid/post roll slots
- 📈 **2 Campaigns**: Tech and Brand campaigns  
- 🎨 **5 Creatives**: Images and audio files
- 🔗 **5 Campaign-Creative Links**: Many-to-many associations

## 🔐 Test Credentials

- **Podcaster**: `test@example.com` / `password123`
- **Advertiser**: `advertiser@example.com` / `password123`

## 🏗️ Migration Best Practices

- Use `00_clean_baseline.sql` for development
- Create new migrations (04+) for Phase 2B features
- Keep migrations idempotent (can run multiple times)
- Test on clean baseline before production deployment