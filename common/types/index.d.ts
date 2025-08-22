export interface BidRequest {
    id: string;
    episode_id: string;
    ad_slot: {
        position: 'pre_roll' | 'mid_roll' | 'post_roll';
        duration: number;
        floor_price_cents?: number;
    };
    context: {
        podcast_id: string;
        category: string;
        demographics?: Demographics;
        geo?: GeoLocation;
    };
    timeout_ms: number;
}
export interface BidResponse {
    bid_price_cents: number;
    campaign_id: string;
    creative_url: string;
    tracking_urls: {
        impression: string;
        click: string;
        completion?: string;
    };
    metadata?: object;
}
export interface Demographics {
    age_range?: string;
    gender?: string;
    interests?: string[];
}
export interface GeoLocation {
    country: string;
    region?: string;
    city?: string;
}
export interface Campaign {
    id: string;
    name: string;
    advertiser_id: string;
    status: 'active' | 'paused' | 'completed';
    budget_cents: number;
    spent_cents: number;
    targeting: {
        demographics?: Demographics;
        geo?: GeoLocation;
        categories?: string[];
        keywords?: string[];
    };
    created_at: string;
    updated_at: string;
}
export interface Podcaster {
    id: string;
    email: string;
    name: string;
    description?: string;
    website?: string;
    total_earnings_cents: number;
    created_at: string;
    updated_at: string;
}
export interface Advertiser {
    id: string;
    email: string;
    company_name: string;
    contact_name: string;
    website?: string;
    total_spent_cents: number;
    created_at: string;
    updated_at: string;
}
export interface AnalyticsEvent {
    id?: string;
    event_type: 'impression' | 'click' | 'completion' | 'ad_win';
    campaign_id?: string;
    creative_id?: string;
    episode_id?: string;
    user_id?: string;
    timestamp: string;
    metadata?: object;
}
export interface APIResponse<T = any> {
    data?: T;
    error?: string;
    status: string;
    timestamp: string;
}
//# sourceMappingURL=index.d.ts.map