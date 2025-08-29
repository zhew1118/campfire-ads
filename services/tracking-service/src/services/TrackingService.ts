import { query } from '../../../../common/middleware/database';
import { createHash } from 'crypto';

type LogEventInput = {
  trackingKey: string;
  ip: string;
  userAgent: string;
  isPrefix: boolean;
  status?: number;
  method?: string;
  rangeStart?: number;
  rangeEnd?: number;
  bytesSent?: number;
  referrer?: string;
};

type PlacementData = {
  placement_id: string;
  campaign_id: string;
  creative_id: string;
  slot_id: string;
  episode_id: string;
  podcast_id: string;
  asset_url: string;
};

export class TrackingService {
  private hashValue(value: string): string {
    return createHash('sha256').update(value).digest('hex').substring(0, 16);
  }

  async logEvent(input: LogEventInput): Promise<void> {
    try {
      // First resolve the tracking key to get placement data
      const placementData = await this.getPlacementData(input.trackingKey, input.isPrefix);
      
      if (!placementData) {
        // eslint-disable-next-line no-console
        console.warn(`Unknown tracking key: ${input.trackingKey}`);
        return;
      }

      // Hash IP and User-Agent for privacy
      const ipHash = this.hashValue(input.ip);
      const uaHash = this.hashValue(input.userAgent);
      
      // Extract referrer host
      const referrerHost = input.referrer ? new URL(input.referrer).hostname : null;

      // Log to impressions_raw table
      await query(`
        INSERT INTO impressions_raw (
          ts, ip_hash, ua_hash, status, method, 
          range_start, range_end, bytes_sent,
          placement_id, campaign_id, creative_id, slot_id, 
          episode_id, podcast_id, referrer_host, user_agent
        ) VALUES (
          NOW(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
        )
      `, [
        ipHash,
        uaHash, 
        input.status || 200,
        input.method || 'GET',
        input.rangeStart,
        input.rangeEnd,
        input.bytesSent,
        placementData.placement_id,
        placementData.campaign_id,
        placementData.creative_id,
        placementData.slot_id,
        placementData.episode_id,
        placementData.podcast_id,
        referrerHost,
        input.userAgent
      ]);
      
      // eslint-disable-next-line no-console
      console.log(`Tracked impression for placement ${placementData.placement_id}`);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error logging tracking event:', error);
      throw error;
    }
  }

  async resolveCreativeURL(trackingKey: string): Promise<string | null> {
    try {
      const placementData = await this.getPlacementData(trackingKey, false);
      return placementData?.asset_url || null;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error resolving creative URL:', error);
      return null;
    }
  }

  private async getPlacementData(trackingKey: string, isPrefix: boolean): Promise<PlacementData | null> {
    try {
      let result;
      
      if (isPrefix) {
        // For prefix mode, we need to find placements by episode URL
        // This is more complex and may require URL parsing or episode lookup
        // For now, return null as prefix mode needs episode-to-placement mapping
        return null;
      } else {
        // Direct tracking key lookup
        result = await query(`
          SELECT 
            p.id as placement_id,
            p.campaign_id,
            p.creative_id,
            p.slot_id,
            s.episode_id,
            e.podcast_id,
            c.file_path as asset_url
          FROM placements p
          JOIN ad_slots s ON s.id = p.slot_id
          JOIN episodes e ON e.id = s.episode_id
          JOIN creatives c ON c.id = p.creative_id
          WHERE p.tracking_key = $1
        `, [trackingKey]);
      }
      
      if (result?.rows?.[0]) {
        return result.rows[0] as PlacementData;
      }
      
      return null;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error getting placement data:', error);
      throw error;
    }
  }

  // Generate unique tracking key for new placements
  generateTrackingKey(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `${timestamp}_${random}`;
  }

  // Create new placement with tracking key
  async createPlacement({
    slotId,
    campaignId,
    creativeId,
    verificationTier = 'ONECAMPFIRE_VERIFIED'
  }: {
    slotId: string;
    campaignId: string;
    creativeId: string;
    verificationTier?: 'ONECAMPFIRE_VERIFIED' | 'PREFIX' | 'HOST_VERIFIED';
  }): Promise<{ placementId: string; trackingKey: string }> {
    const trackingKey = this.generateTrackingKey();
    
    const result = await query(`
      INSERT INTO placements (slot_id, campaign_id, creative_id, verification_tier, tracking_key)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `, [slotId, campaignId, creativeId, verificationTier, trackingKey]);
    
    return {
      placementId: result.rows[0].id,
      trackingKey
    };
  }
}

