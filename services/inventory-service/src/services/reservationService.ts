import { query } from '../../../../common/middleware';
import { NotFoundError, ConflictError, DatabaseError } from '../../../../common/middleware';

interface SlotReservation {
  id: string;
  ad_slot_id: string;
  campaign_id: string;
  advertiser_id: string;
  bid_cpm: number; // in micros
  status: 'reserved' | 'confirmed' | 'expired' | 'released';
  expires_at: string;
  reserved_at: string;
  confirmed_at?: string;
}

export class ReservationService {
  private readonly RESERVATION_DURATION_SECONDS = 60;

  /**
   * Reserve an ad slot for bidding (60-second soft hold)
   */
  async reserveSlot(
    adSlotId: string, 
    campaignId: string, 
    advertiserId: string, 
    bidCpmMicros: number
  ): Promise<SlotReservation> {
    try {
      // First, expire any old reservations
      await this.expireOldReservations();

      // Check if slot is available (not confirmed by someone else)
      const existingReservation = await this.getConfirmedReservation(adSlotId);
      if (existingReservation) {
        throw new ConflictError('Ad slot is already confirmed by another advertiser');
      }

      // Verify the ad slot exists, is available, and check CPM floor
      const slotResult = await query(
        'SELECT id, available, cpm_floor FROM ad_slots WHERE id = $1',
        [adSlotId]
      );

      if (slotResult.rows.length === 0) {
        throw new NotFoundError('Ad slot not found');
      }

      const slot = slotResult.rows[0];
      if (!slot.available) {
        throw new ConflictError('Ad slot is not available');
      }

      // Convert CPM floor from cents to micros for comparison
      const floorMicros = Math.round(slot.cpm_floor * 10000); // cents to micros
      if (bidCpmMicros < floorMicros) {
        const bidDollars = (bidCpmMicros / 1000000).toFixed(2);
        const floorDollars = (floorMicros / 1000000).toFixed(2);
        const bidTooLowError = new ConflictError(`Bid of $${bidDollars} CPM is below the minimum floor price of $${floorDollars} CPM for this slot`);
        bidTooLowError.code = 'BID_TOO_LOW';
        throw bidTooLowError;
      }

      // Create reservation with 60-second expiration
      const expiresAt = new Date(Date.now() + this.RESERVATION_DURATION_SECONDS * 1000);
      
      const result = await query(`
        INSERT INTO slot_reservations (
          ad_slot_id, campaign_id, advertiser_id, bid_cpm_micros, status, expires_at
        )
        VALUES ($1, $2, $3, $4, 'active', $5)
        RETURNING *
      `, [adSlotId, campaignId, advertiserId, bidCpmMicros, expiresAt]);

      return result.rows[0];
    } catch (error: any) {
      if (error instanceof ConflictError || error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to reserve slot', error.code);
    }
  }

  /**
   * Confirm a reservation (winning bid)
   */
  async confirmReservation(reservationId: string, advertiserId: string): Promise<SlotReservation | null> {
    try {
      // First expire old reservations
      await this.expireOldReservations();

      const result = await query(`
        UPDATE slot_reservations 
        SET status = 'confirmed', confirmed_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND advertiser_id = $2 AND status = 'reserved' AND expires_at > CURRENT_TIMESTAMP
        RETURNING *
      `, [reservationId, advertiserId]);

      return result.rows[0] || null;
    } catch (error: any) {
      throw new DatabaseError('Failed to confirm reservation', error.code);
    }
  }

  /**
   * Release a reservation (losing bid or explicit release)
   */
  async releaseReservation(reservationId: string, advertiserId: string): Promise<{ 
    reservation_id: string;
    previous_status: string;
    new_status: string;
  } | null> {
    try {
      const result = await query(`
        UPDATE slot_reservations 
        SET status = 'released'
        WHERE id = $1 AND advertiser_id = $2 AND status = 'reserved'
        RETURNING id, 'reserved' as previous_status, status as new_status
      `, [reservationId, advertiserId]);

      if (result.rows.length === 0) {
        return null;
      }

      return {
        reservation_id: result.rows[0].id,
        previous_status: result.rows[0].previous_status,
        new_status: result.rows[0].new_status
      };
    } catch (error: any) {
      throw new DatabaseError('Failed to release reservation', error.code);
    }
  }

  /**
   * Get all reservations for a slot (for RTB engine to evaluate bids)
   * Access control: Admin OR slot owner (podcaster)
   */
  async getSlotReservations(adSlotId: string, userId?: string, userRole?: string): Promise<SlotReservation[]> {
    try {
      // First expire old reservations
      await this.expireOldReservations();

      // Check access permissions
      if (userRole !== 'admin') {
        // Verify user owns this slot
        const ownershipCheck = await query(`
          SELECT COUNT(*) as count FROM ad_slots a
          JOIN episodes e ON a.episode_id = e.id
          JOIN podcasts p ON e.podcast_id = p.id
          WHERE a.id = $1 AND p.podcaster_id = $2
        `, [adSlotId, userId]);

        if (parseInt(ownershipCheck.rows[0].count) === 0) {
          throw new NotFoundError('Ad slot not found or access denied');
        }
      }

      const result = await query(`
        SELECT sr.*, c.name as campaign_name, u.email as advertiser_email
        FROM slot_reservations sr
        JOIN campaigns c ON sr.campaign_id = c.id
        JOIN users u ON sr.advertiser_id = u.id
        WHERE sr.ad_slot_id = $1 AND sr.status = 'reserved' AND sr.expires_at > CURRENT_TIMESTAMP
        ORDER BY sr.bid_cpm DESC, sr.reserved_at ASC
      `, [adSlotId]);

      return result.rows;
    } catch (error: any) {
      if (error instanceof NotFoundError) throw error;
      throw new DatabaseError('Failed to fetch slot reservations', error.code);
    }
  }

  /**
   * Check if slot has a confirmed reservation
   */
  async getConfirmedReservation(adSlotId: string): Promise<SlotReservation | null> {
    try {
      const result = await query(`
        SELECT * FROM slot_reservations 
        WHERE ad_slot_id = $1 AND status = 'confirmed'
      `, [adSlotId]);

      return result.rows[0] || null;
    } catch (error: any) {
      throw new DatabaseError('Failed to check confirmed reservation', error.code);
    }
  }

  /**
   * Get reservations for a campaign (advertiser can only see their own)
   */
  async getCampaignReservations(campaignId: string, advertiserId: string): Promise<SlotReservation[]> {
    try {
      const result = await query(`
        SELECT sr.*, a.position, a.duration, e.title as episode_title, p.name as podcast_name
        FROM slot_reservations sr
        JOIN ad_slots a ON sr.ad_slot_id = a.id
        JOIN episodes e ON a.episode_id = e.id
        JOIN podcasts p ON e.podcast_id = p.id
        WHERE sr.campaign_id = $1 AND sr.advertiser_id = $2
        ORDER BY sr.reserved_at DESC
      `, [campaignId, advertiserId]);

      return result.rows;
    } catch (error: any) {
      throw new DatabaseError('Failed to fetch campaign reservations', error.code);
    }
  }

  /**
   * Check if slots are available for RTB (no confirmed reservations)
   */
  async getAvailableSlots(filters: {
    category?: string;
    minCpm?: number;
    maxCpm?: number;
    position?: string;
    duration?: number;
    page: number;
    limit: number;
  }): Promise<{ slots: any[]; total: number }> {
    try {
      let whereClause = `
        WHERE a.available = true 
        AND NOT EXISTS (
          SELECT 1 FROM slot_reservations sr 
          WHERE sr.ad_slot_id = a.id AND sr.status = 'confirmed'
        )
      `;
      const params: any[] = [];
      let paramCount = 0;

      if (filters.category) {
        paramCount++;
        whereClause += ` AND p.category = $${paramCount}`;
        params.push(filters.category);
      }

      if (filters.minCpm) {
        paramCount++;
        whereClause += ` AND a.cpm_floor >= $${paramCount}`;
        params.push(filters.minCpm);
      }

      if (filters.maxCpm) {
        paramCount++;
        whereClause += ` AND a.cpm_floor <= $${paramCount}`;
        params.push(filters.maxCpm);
      }

      if (filters.position) {
        paramCount++;
        whereClause += ` AND a.position = $${paramCount}`;
        params.push(filters.position);
      }

      if (filters.duration) {
        paramCount++;
        whereClause += ` AND a.duration = $${paramCount}`;
        params.push(filters.duration);
      }

      // Add pagination
      const offset = (filters.page - 1) * filters.limit;
      paramCount += 2;
      const limitClause = `LIMIT $${paramCount - 1} OFFSET $${paramCount}`;
      params.push(filters.limit, offset);

      const [slotsResult, countResult] = await Promise.all([
        query(`
          SELECT 
            a.*,
            e.title as episode_title,
            e.duration as episode_duration,
            p.name as podcast_name,
            p.category as podcast_category
          FROM ad_slots a
          JOIN episodes e ON a.episode_id = e.id
          JOIN podcasts p ON e.podcast_id = p.id
          ${whereClause}
          ORDER BY a.cpm_floor ASC
          ${limitClause}
        `, params.slice(0, -2).concat([filters.limit, offset])),

        query(`
          SELECT COUNT(*) as total FROM ad_slots a
          JOIN episodes e ON a.episode_id = e.id
          JOIN podcasts p ON e.podcast_id = p.id
          ${whereClause}
        `, params.slice(0, -2))
      ]);

      return {
        slots: slotsResult.rows,
        total: parseInt(countResult.rows[0].total)
      };
    } catch (error: any) {
      throw new DatabaseError('Failed to fetch available slots', error.code);
    }
  }

  /**
   * Expire old reservations (cleanup function)
   */
  async expireOldReservations(): Promise<number> {
    try {
      const result = await query(`
        UPDATE slot_reservations 
        SET status = 'expired' 
        WHERE status = 'reserved' AND expires_at < CURRENT_TIMESTAMP
      `);

      return result.rowCount || 0;
    } catch (error: any) {
      throw new DatabaseError('Failed to expire old reservations', error.code);
    }
  }

  /**
   * Get reservation statistics
   */
  async getReservationStats(): Promise<{
    totalActive: number;
    totalConfirmed: number;
    totalExpired: number;
    averageBidCpm: number;
  }> {
    try {
      const result = await query(`
        SELECT 
          COUNT(CASE WHEN status = 'reserved' AND expires_at > CURRENT_TIMESTAMP THEN 1 END) as active_count,
          COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_count,
          COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired_count,
          COALESCE(AVG(CASE WHEN status IN ('reserved', 'confirmed') THEN bid_cpm END), 0) as avg_bid_cpm
        FROM slot_reservations
      `);

      const stats = result.rows[0];
      return {
        totalActive: parseInt(stats.active_count || '0'),
        totalConfirmed: parseInt(stats.confirmed_count || '0'),
        totalExpired: parseInt(stats.expired_count || '0'),
        averageBidCpm: parseFloat(stats.avg_bid_cpm || '0')
      };
    } catch (error: any) {
      throw new DatabaseError('Failed to fetch reservation stats', error.code);
    }
  }
}