-- Campfire Ads Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "gen_random_uuid";

-- Create custom types
CREATE TYPE user_role AS ENUM ('publisher', 'advertiser', 'admin');
CREATE TYPE campaign_status AS ENUM ('draft', 'active', 'paused', 'ended');
CREATE TYPE ad_position AS ENUM ('pre_roll', 'mid_roll', 'post_roll');

-- Users (publishers & advertisers)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role user_role NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Podcasts
CREATE TABLE podcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  rss_url VARCHAR(500) NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Episodes
CREATE TABLE episodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  podcast_id UUID REFERENCES podcasts(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  audio_url VARCHAR(500) NOT NULL,
  duration_seconds INTEGER,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Ad Campaigns
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  budget_cents INTEGER NOT NULL,
  target_cpm_cents INTEGER,
  targeting JSONB DEFAULT '{}',
  status campaign_status DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Ad Inventory Slots
CREATE TABLE ad_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  episode_id UUID REFERENCES episodes(id) ON DELETE CASCADE,
  position ad_position NOT NULL,
  duration_seconds INTEGER NOT NULL,
  floor_price_cents INTEGER DEFAULT 0,
  filled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Bid Requests & Responses
CREATE TABLE bid_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_slot_id UUID REFERENCES ad_slots(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  bid_price_cents INTEGER,
  won BOOLEAN DEFAULT FALSE,
  served BOOLEAN DEFAULT FALSE,
  event_data JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Impressions and Clicks tracking
CREATE TABLE ad_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bid_event_id UUID REFERENCES bid_events(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL, -- 'impression', 'click', 'completion'
  timestamp TIMESTAMP DEFAULT NOW(),
  user_agent TEXT,
  ip_address INET,
  metadata JSONB DEFAULT '{}'
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_podcasts_user_id ON podcasts(user_id);
CREATE INDEX idx_episodes_podcast_id ON episodes(podcast_id);
CREATE INDEX idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_ad_slots_episode_id ON ad_slots(episode_id);
CREATE INDEX idx_ad_slots_filled ON ad_slots(filled);
CREATE INDEX idx_bid_events_ad_slot_id ON bid_events(ad_slot_id);
CREATE INDEX idx_bid_events_campaign_id ON bid_events(campaign_id);
CREATE INDEX idx_bid_events_created_at ON bid_events(created_at);
CREATE INDEX idx_ad_events_bid_event_id ON ad_events(bid_event_id);
CREATE INDEX idx_ad_events_event_type ON ad_events(event_type);
CREATE INDEX idx_ad_events_timestamp ON ad_events(timestamp);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_podcasts_updated_at BEFORE UPDATE ON podcasts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_episodes_updated_at BEFORE UPDATE ON episodes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ad_slots_updated_at BEFORE UPDATE ON ad_slots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for development
INSERT INTO users (email, password_hash, role) VALUES 
  ('publisher@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj2yNjOOJBQy', 'publisher'), -- password: demo123
  ('advertiser@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj2yNjOOJBQy', 'advertiser'); -- password: demo123

INSERT INTO podcasts (user_id, title, rss_url, description) VALUES 
  ((SELECT id FROM users WHERE email = 'publisher@example.com'), 'The Daily Tech Show', 'https://example.com/rss/tech', 'Daily technology news and insights'),
  ((SELECT id FROM users WHERE email = 'publisher@example.com'), 'Morning Coffee Chat', 'https://example.com/rss/coffee', 'Casual morning conversations');

INSERT INTO episodes (podcast_id, title, audio_url, duration_seconds, published_at) VALUES 
  ((SELECT id FROM podcasts WHERE title = 'The Daily Tech Show'), 'Tech News Weekly #145', 'https://example.com/audio/tech-145.mp3', 1800, NOW() - INTERVAL '2 hours'),
  ((SELECT id FROM podcasts WHERE title = 'Morning Coffee Chat'), 'Coffee Talk #89', 'https://example.com/audio/coffee-89.mp3', 2400, NOW() - INTERVAL '1 day');

INSERT INTO campaigns (user_id, name, budget_cents, target_cpm_cents, status) VALUES 
  ((SELECT id FROM users WHERE email = 'advertiser@example.com'), 'Tech Podcast Summer Campaign', 500000, 250, 'active'),
  ((SELECT id FROM users WHERE email = 'advertiser@example.com'), 'Morning Show Ads', 300000, 200, 'paused');

-- Create ad slots for episodes
INSERT INTO ad_slots (episode_id, position, duration_seconds, floor_price_cents) VALUES 
  ((SELECT id FROM episodes WHERE title = 'Tech News Weekly #145'), 'pre_roll', 30, 100),
  ((SELECT id FROM episodes WHERE title = 'Tech News Weekly #145'), 'mid_roll', 60, 200),
  ((SELECT id FROM episodes WHERE title = 'Coffee Talk #89'), 'pre_roll', 30, 100),
  ((SELECT id FROM episodes WHERE title = 'Coffee Talk #89'), 'post_roll', 30, 80);