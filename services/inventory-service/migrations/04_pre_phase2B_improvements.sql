-- Pre-Phase 2B Database Improvements
-- Simple and clean migration for production deployment

-- =============================================================================
-- 1. PERFORMANCE INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_creatives_advertiser_id ON creatives(advertiser_id);
CREATE INDEX IF NOT EXISTS idx_campaign_creatives_campaign_id ON campaign_creatives(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_creatives_creative_id ON campaign_creatives(creative_id);
CREATE INDEX IF NOT EXISTS idx_campaign_creatives_assigned_by ON campaign_creatives(assigned_by);

-- =============================================================================
-- 2. AUDIO METADATA COLUMNS
-- =============================================================================

ALTER TABLE creatives ADD COLUMN IF NOT EXISTS audio_bitrate_kbps INTEGER;
ALTER TABLE creatives ADD COLUMN IF NOT EXISTS audio_sample_rate_hz INTEGER;
ALTER TABLE creatives ADD COLUMN IF NOT EXISTS audio_channels SMALLINT;
ALTER TABLE creatives ADD COLUMN IF NOT EXISTS lufs_integrated NUMERIC(5,2);
ALTER TABLE creatives ADD COLUMN IF NOT EXISTS transcript_url TEXT;

-- =============================================================================
-- 3. CDN AND VERSIONING
-- =============================================================================

ALTER TABLE creatives ADD COLUMN IF NOT EXISTS cdn_url TEXT;
ALTER TABLE creatives ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;

-- =============================================================================
-- 4. STATUS LIFECYCLE (BACKWARD COMPATIBLE)
-- =============================================================================

-- Add status column with CHECK constraint
ALTER TABLE creatives ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft' 
  CHECK (status IN ('draft','in_review','approved','rejected','archived'));

-- =============================================================================
-- 5. CAMPAIGN-CREATIVE ENHANCEMENTS
-- =============================================================================

ALTER TABLE campaign_creatives ADD COLUMN IF NOT EXISTS weight SMALLINT DEFAULT 100;
ALTER TABLE campaign_creatives ADD COLUMN IF NOT EXISTS flight_start TIMESTAMPTZ;
ALTER TABLE campaign_creatives ADD COLUMN IF NOT EXISTS flight_end TIMESTAMPTZ;
ALTER TABLE campaign_creatives ADD COLUMN IF NOT EXISTS position TEXT;
ALTER TABLE campaign_creatives ADD COLUMN IF NOT EXISTS frequency_cap_per_episode SMALLINT;
ALTER TABLE campaign_creatives ADD COLUMN IF NOT EXISTS notes TEXT;

-- =============================================================================
-- 6. TRACKING SERVICE TABLES (Phase 2B Ready)
-- =============================================================================

CREATE TABLE IF NOT EXISTS placements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slot_id UUID NOT NULL REFERENCES ad_slots(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  creative_id UUID NOT NULL REFERENCES creatives(id) ON DELETE CASCADE,
  verification_tier TEXT NOT NULL
    CHECK (verification_tier IN ('ONECAMPFIRE_VERIFIED','PREFIX','HOST_VERIFIED')),
  tracking_key TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_placements_campaign_id ON placements(campaign_id);
CREATE INDEX IF NOT EXISTS idx_placements_creative_id ON placements(creative_id);
CREATE INDEX IF NOT EXISTS idx_placements_slot_id ON placements(slot_id);

CREATE TABLE IF NOT EXISTS impressions_raw (
  id BIGSERIAL PRIMARY KEY,
  ts TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_hash TEXT,
  ua_hash TEXT,
  status INT,
  method TEXT,
  range_start BIGINT,
  range_end BIGINT,
  bytes_sent BIGINT,
  placement_id UUID REFERENCES placements(id) ON DELETE SET NULL,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  creative_id UUID REFERENCES creatives(id) ON DELETE SET NULL,
  slot_id UUID REFERENCES ad_slots(id) ON DELETE SET NULL,
  episode_id UUID,
  podcast_id UUID,
  referrer_host TEXT,
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_impr_raw_ts ON impressions_raw(ts);
CREATE INDEX IF NOT EXISTS idx_impr_raw_placement ON impressions_raw(placement_id);

CREATE TABLE IF NOT EXISTS host_reports (
  id BIGSERIAL PRIMARY KEY,
  placement_id UUID NOT NULL REFERENCES placements(id) ON DELETE CASCADE,
  source_host TEXT,
  evidence_url TEXT,
  period_start DATE,
  period_end DATE,
  downloads INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 7. UPDATE EXISTING DATA
-- =============================================================================

-- Migrate existing is_approved data to new status column (BACKWARD COMPATIBLE)
-- Keep both is_approved and status columns for compatibility
UPDATE creatives 
SET status = CASE 
    WHEN is_approved = TRUE THEN 'approved'
    WHEN is_approved = FALSE AND rejection_reason IS NOT NULL THEN 'rejected'
    WHEN is_approved = FALSE THEN 'draft'
    ELSE 'draft'
END;

-- Add CDN URLs and audio metadata for existing creatives
UPDATE creatives 
SET 
    cdn_url = 'https://cdn.onecampfire.media' || file_path,
    audio_bitrate_kbps = CASE WHEN creative_type = 'audio' THEN 128 ELSE NULL END,
    audio_sample_rate_hz = CASE WHEN creative_type = 'audio' THEN 44100 ELSE NULL END,
    audio_channels = CASE WHEN creative_type = 'audio' THEN 2 ELSE NULL END,
    lufs_integrated = CASE WHEN creative_type = 'audio' THEN -16.0 ELSE NULL END
WHERE cdn_url IS NULL;

-- =============================================================================
-- 8. BACKWARD COMPATIBILITY NOTES
-- =============================================================================
-- 
-- This migration keeps BOTH is_approved and status columns:
-- - is_approved (boolean) - Legacy column for backward compatibility
-- - status (text) - New lifecycle column with CHECK constraint
-- - rejection_reason (text) - Kept for reviewer feedback
--
-- Future versions can gradually migrate to status-only after API updates
-- 
-- Migration complete - database ready for Phase 2B tracking service