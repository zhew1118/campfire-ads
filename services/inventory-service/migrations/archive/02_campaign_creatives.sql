-- Campaign Creatives Management
-- Adds support for creative assets (images, audio, video) for campaigns

-- Campaign creatives table for storing creative assets
CREATE TABLE IF NOT EXISTS campaign_creatives (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_campaign_creatives_campaign_id ON campaign_creatives(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_creatives_creative_type ON campaign_creatives(creative_type);
CREATE INDEX IF NOT EXISTS idx_campaign_creatives_is_approved ON campaign_creatives(is_approved);

-- Add some sample creative data for testing
INSERT INTO campaign_creatives (id, campaign_id, name, file_path, file_name, file_size, mime_type, creative_type, width, height, duration, is_approved) VALUES
    ('cc0e8400-e29b-41d4-a716-446655440000', '990e8400-e29b-41d4-a716-446655440000', 'Tech Product Hero Image', '/uploads/creatives/tech-hero-banner.jpg', 'tech-hero-banner.jpg', 245760, 'image/jpeg', 'image', 1200, 628, NULL, TRUE),
    ('cc0e8400-e29b-41d4-a716-446655440001', '990e8400-e29b-41d4-a716-446655440000', '30-Second Tech Ad', '/uploads/creatives/tech-audio-ad-30s.mp3', 'tech-audio-ad-30s.mp3', 480000, 'audio/mpeg', 'audio', NULL, NULL, 30, TRUE),
    ('cc0e8400-e29b-41d4-a716-446655440002', '990e8400-e29b-41d4-a716-446655440001', 'Creative Brand Logo', '/uploads/creatives/brand-logo-square.png', 'brand-logo-square.png', 125440, 'image/png', 'image', 512, 512, NULL, TRUE),
    ('cc0e8400-e29b-41d4-a716-446655440003', '990e8400-e29b-41d4-a716-446655440001', '60-Second Brand Story', '/uploads/creatives/brand-story-60s.mp3', 'brand-story-60s.mp3', 960000, 'audio/mpeg', 'audio', NULL, NULL, 60, FALSE)
ON CONFLICT (id) DO NOTHING;