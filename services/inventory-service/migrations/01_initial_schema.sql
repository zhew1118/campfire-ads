-- Initial schema for Campfire Ads inventory service
-- This file will be executed when the PostgreSQL container starts

-- Enable UUID extension for primary keys
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (podcasters and advertisers)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('podcaster', 'advertiser', 'admin')),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    company_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Podcasts table
CREATE TABLE IF NOT EXISTS podcasts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    podcaster_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    rss_url VARCHAR(500),
    artwork_url VARCHAR(500),
    language VARCHAR(10) DEFAULT 'en',
    explicit BOOLEAN DEFAULT FALSE,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Episodes table
CREATE TABLE IF NOT EXISTS episodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    podcast_id UUID NOT NULL REFERENCES podcasts(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    duration INTEGER NOT NULL, -- duration in seconds
    audio_url VARCHAR(500) NOT NULL,
    file_size BIGINT,
    episode_number INTEGER,
    season_number INTEGER,
    published_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Ad slots table
CREATE TABLE IF NOT EXISTS ad_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    episode_id UUID NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
    position VARCHAR(50) NOT NULL CHECK (position IN ('pre_roll', 'mid_roll', 'post_roll')),
    duration INTEGER NOT NULL, -- duration in seconds
    cpm_floor DECIMAL(8,2) NOT NULL DEFAULT 0, -- minimum CPM in cents
    available BOOLEAN DEFAULT true,
    start_time INTEGER, -- seconds from episode start (for mid-roll)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    advertiser_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    budget DECIMAL(12,2) NOT NULL, -- total budget in cents
    spent DECIMAL(12,2) DEFAULT 0, -- amount spent in cents
    target_categories TEXT[], -- podcast categories to target
    max_cpm DECIMAL(8,2) NOT NULL, -- maximum CPM willing to pay
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Bookings table (links campaigns to ad slots)
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    ad_slot_id UUID NOT NULL REFERENCES ad_slots(id) ON DELETE CASCADE,
    cpm_price DECIMAL(10,2) NOT NULL, -- actual price paid in cents
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'delivered', 'cancelled')),
    booked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    delivered_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_podcasts_podcaster_id ON podcasts(podcaster_id);
CREATE INDEX IF NOT EXISTS idx_podcasts_category ON podcasts(category);
CREATE INDEX IF NOT EXISTS idx_episodes_podcast_id ON episodes(podcast_id);
CREATE INDEX IF NOT EXISTS idx_episodes_published_at ON episodes(published_at);
CREATE INDEX IF NOT EXISTS idx_ad_slots_episode_id ON ad_slots(episode_id);
CREATE INDEX IF NOT EXISTS idx_ad_slots_available ON ad_slots(available);
CREATE INDEX IF NOT EXISTS idx_campaigns_advertiser_id ON campaigns(advertiser_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_bookings_campaign_id ON bookings(campaign_id);
CREATE INDEX IF NOT EXISTS idx_bookings_ad_slot_id ON bookings(ad_slot_id);

-- Insert sample data for testing
INSERT INTO users (id, email, password_hash, role, first_name, last_name, company_name) VALUES
    ('550e8400-e29b-41d4-a716-446655440000', 'test@example.com', '$2b$10$eJ/aWQQyZe8F9kqFQqQvv.Q7KRKDQOjYqZJQJhYGZvVF7W8zRQvV.', 'podcaster', 'John', 'Doe', 'Podcast Studio'),
    ('550e8400-e29b-41d4-a716-446655440001', 'advertiser@example.com', '$2b$10$eJ/aWQQyZe8F9kqFQqQvv.Q7KRKDQOjYqZJQJhYGZvVF7W8zRQvV.', 'advertiser', 'Jane', 'Smith', 'TechCorp'),
    ('550e8400-e29b-41d4-a716-446655440002', 'podcaster2@example.com', '$2b$10$eJ/aWQQyZe8F9kqFQqQvv.Q7KRKDQOjYqZJQJhYGZvVF7W8zRQvV.', 'podcaster', 'Sarah', 'Williams', 'Creative Audio Lab'),
    ('550e8400-e29b-41d4-a716-446655440003', 'advertiser2@example.com', '$2b$10$eJ/aWQQyZe8F9kqFQqQvv.Q7KRKDQOjYqZJQJhYGZvVF7W8zRQvV.', 'advertiser', 'Mike', 'Johnson', 'AdTech Solutions')
ON CONFLICT (email) DO NOTHING;

INSERT INTO podcasts (id, name, description, category, podcaster_id) VALUES
    ('660e8400-e29b-41d4-a716-446655440000', 'Tech Talk Daily', 'Daily discussions about the latest in technology', 'Technology', '550e8400-e29b-41d4-a716-446655440000'),
    ('660e8400-e29b-41d4-a716-446655440001', 'Morning Coffee Chat', 'Casual morning conversations', 'Lifestyle', '550e8400-e29b-41d4-a716-446655440000'),
    ('660e8400-e29b-41d4-a716-446655440002', 'Business Mindset Weekly', 'Weekly insights on entrepreneurship and business strategy', 'Business', '550e8400-e29b-41d4-a716-446655440002'),
    ('660e8400-e29b-41d4-a716-446655440003', 'Creative Chronicles', 'Conversations with artists, designers, and creators', 'Arts', '550e8400-e29b-41d4-a716-446655440002')
ON CONFLICT (id) DO NOTHING;

INSERT INTO episodes (id, podcast_id, title, description, duration, audio_url, status) VALUES
    ('770e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440000', 'The Future of AI', 'Exploring artificial intelligence trends', 1800, 'https://example.com/audio/ai-episode.mp3', 'published'),
    ('770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 'Weekend Plans', 'Discussing weekend activities', 1200, 'https://example.com/audio/weekend-episode.mp3', 'published'),
    ('770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002', 'Startup Success Stories', 'Interviews with successful entrepreneurs', 2400, 'https://example.com/audio/startup-episode.mp3', 'published'),
    ('770e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440003', 'Designer Spotlight', 'Featuring emerging design talents', 1600, 'https://example.com/audio/design-episode.mp3', 'published')
ON CONFLICT (id) DO NOTHING;

INSERT INTO ad_slots (id, episode_id, position, duration, cpm_floor) VALUES
    ('880e8400-e29b-41d4-a716-446655440000', '770e8400-e29b-41d4-a716-446655440000', 'pre_roll', 30, 250),
    ('880e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440000', 'mid_roll', 60, 300),
    ('880e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440001', 'pre_roll', 30, 200),
    ('880e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440002', 'pre_roll', 30, 400),
    ('880e8400-e29b-41d4-a716-446655440004', '770e8400-e29b-41d4-a716-446655440002', 'mid_roll', 45, 450),
    ('880e8400-e29b-41d4-a716-446655440005', '770e8400-e29b-41d4-a716-446655440003', 'pre_roll', 30, 350),
    ('880e8400-e29b-41d4-a716-446655440006', '770e8400-e29b-41d4-a716-446655440003', 'post_roll', 15, 300)
ON CONFLICT (id) DO NOTHING;

INSERT INTO campaigns (id, advertiser_id, name, description, budget, max_cpm, target_categories, start_date, end_date, status) VALUES
    ('990e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', 'Q4 Tech Product Launch', 'Promoting our latest tech product', 5000000, 350, ARRAY['Technology', 'Business'], '2024-10-01', '2024-12-31', 'active'),
    ('990e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', 'Creative Brand Awareness', 'Building brand awareness through creative content', 3000000, 500, ARRAY['Arts', 'Lifestyle'], '2024-11-01', '2024-12-31', 'active')
ON CONFLICT (id) DO NOTHING;

-- Add slot reservations table for RTB functionality
CREATE TABLE IF NOT EXISTS slot_reservations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ad_slot_id UUID NOT NULL REFERENCES ad_slots(id) ON DELETE CASCADE,
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    advertiser_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bid_cpm BIGINT NOT NULL, -- store in micros (e.g. 1000000 = $1.00 CPM)
    status VARCHAR(20) NOT NULL CHECK (status IN ('reserved','confirmed','expired','released')),
    expires_at TIMESTAMPTZ NOT NULL,
    reserved_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMPTZ
);

-- Only one confirmed reservation per slot
CREATE UNIQUE INDEX unique_confirmed_reservation
ON slot_reservations(ad_slot_id)
WHERE status = 'confirmed';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_slot_reservations_ad_slot_id ON slot_reservations(ad_slot_id);
CREATE INDEX IF NOT EXISTS idx_slot_reservations_campaign_id ON slot_reservations(campaign_id);
CREATE INDEX IF NOT EXISTS idx_slot_reservations_advertiser_id ON slot_reservations(advertiser_id);
CREATE INDEX IF NOT EXISTS idx_slot_reservations_expires_at ON slot_reservations(expires_at);
CREATE INDEX IF NOT EXISTS idx_slot_reservations_status ON slot_reservations(status);