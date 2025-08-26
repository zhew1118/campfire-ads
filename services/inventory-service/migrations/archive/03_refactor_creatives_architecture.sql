-- Refactor Creative Management Architecture
-- Separates global creatives from campaign assignments
-- Implements proper many-to-many relationship

-- Drop existing campaign_creatives table (wrong architecture)
DROP TABLE IF EXISTS campaign_creatives CASCADE;

-- Create global creatives table (advertiser's creative library)
CREATE TABLE IF NOT EXISTS creatives (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    advertiser_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL, -- human-readable name
    file_path VARCHAR(500) NOT NULL, -- relative path to stored file
    file_name VARCHAR(255) NOT NULL, -- original filename
    file_size BIGINT NOT NULL, -- file size in bytes
    mime_type VARCHAR(100) NOT NULL, -- MIME type (image/jpeg, audio/mp3, etc.)
    creative_type VARCHAR(50) NOT NULL CHECK (creative_type IN ('image', 'audio', 'video')),
    
    -- Creative specifications
    width INTEGER, -- for images/videos
    height INTEGER, -- for images/videos
    duration INTEGER, -- for audio/video in seconds
    
    -- Validation metadata
    is_approved BOOLEAN DEFAULT FALSE,
    rejection_reason TEXT,
    
    -- File metadata
    checksum VARCHAR(64), -- SHA-256 checksum for integrity
    upload_ip INET, -- IP address of uploader for audit
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create campaign-creative association table (many-to-many)
CREATE TABLE IF NOT EXISTS campaign_creatives (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    creative_id UUID NOT NULL REFERENCES creatives(id) ON DELETE CASCADE,
    
    -- Assignment metadata
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    assigned_by UUID REFERENCES users(id),
    
    -- Prevent duplicate assignments
    UNIQUE(campaign_id, creative_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_creatives_advertiser_id ON creatives(advertiser_id);
CREATE INDEX IF NOT EXISTS idx_creatives_creative_type ON creatives(creative_type);
CREATE INDEX IF NOT EXISTS idx_creatives_is_approved ON creatives(is_approved);
CREATE INDEX IF NOT EXISTS idx_campaign_creatives_campaign_id ON campaign_creatives(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_creatives_creative_id ON campaign_creatives(creative_id);

-- Add sample creative data for testing
INSERT INTO creatives (id, advertiser_id, name, file_path, file_name, file_size, mime_type, creative_type, width, height, duration, is_approved) VALUES
    ('cc0e8400-e29b-41d4-a716-446655440000', '11000000-1100-1100-1100-110000000000', 'Tech Product Hero Banner', '/uploads/creatives/tech-hero-banner.jpg', 'tech-hero-banner.jpg', 245760, 'image/jpeg', 'image', 1200, 628, NULL, TRUE),
    ('cc0e8400-e29b-41d4-a716-446655440001', '11000000-1100-1100-1100-110000000000', '30-Second Tech Audio Ad', '/uploads/creatives/tech-audio-ad-30s.mp3', 'tech-audio-ad-30s.mp3', 480000, 'audio/mpeg', 'audio', NULL, NULL, 30, TRUE),
    ('cc0e8400-e29b-41d4-a716-446655440002', '11000000-1100-1100-1100-110000000000', 'Brand Logo Square', '/uploads/creatives/brand-logo-square.png', 'brand-logo-square.png', 125440, 'image/png', 'image', 512, 512, NULL, TRUE),
    ('cc0e8400-e29b-41d4-a716-446655440003', '22000000-2200-2200-2200-220000000000', '60-Second Brand Story', '/uploads/creatives/brand-story-60s.mp3', 'brand-story-60s.mp3', 960000, 'audio/mpeg', 'audio', NULL, NULL, 60, FALSE),
    ('cc0e8400-e29b-41d4-a716-446655440004', '22000000-2200-2200-2200-220000000000', 'Holiday Promo Audio', '/uploads/creatives/holiday-promo.mp3', 'holiday-promo.mp3', 720000, 'audio/mpeg', 'audio', NULL, NULL, 45, TRUE)
ON CONFLICT (id) DO NOTHING;

-- Add sample campaign-creative associations
INSERT INTO campaign_creatives (campaign_id, creative_id, assigned_by) VALUES
    -- Tech campaign using tech creatives
    ('990e8400-e29b-41d4-a716-446655440000', 'cc0e8400-e29b-41d4-a716-446655440000', '11000000-1100-1100-1100-110000000000'),
    ('990e8400-e29b-41d4-a716-446655440000', 'cc0e8400-e29b-41d4-a716-446655440001', '11000000-1100-1100-1100-110000000000'),
    -- Brand campaign using brand creatives  
    ('990e8400-e29b-41d4-a716-446655440001', 'cc0e8400-e29b-41d4-a716-446655440002', '11000000-1100-1100-1100-110000000000'),
    ('990e8400-e29b-41d4-a716-446655440001', 'cc0e8400-e29b-41d4-a716-446655440003', '22000000-2200-2200-2200-220000000000'),
    -- Holiday campaign reusing existing creative
    ('990e8400-e29b-41d4-a716-446655440002', 'cc0e8400-e29b-41d4-a716-446655440004', '22000000-2200-2200-2200-220000000000')
ON CONFLICT (campaign_id, creative_id) DO NOTHING;