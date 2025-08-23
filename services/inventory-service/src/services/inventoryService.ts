import { query } from '../../../../common/middleware';
import { AdSlot, Podcast, Episode, User } from '../../../../common/types';
import { NotFoundError, ConflictError, DatabaseError } from '../../../../common/middleware';

interface InventoryFilters {
  category?: string;
  position?: 'pre_roll' | 'mid_roll' | 'post_roll';
  minCpm?: number;
  maxCpm?: number;
  duration?: number;
  available?: boolean;
}

interface SearchFilters {
  query?: string;
  categories?: string[];
  positions?: string[];
  minCpm?: number;
  maxCpm?: number;
  minDuration?: number;
  maxDuration?: number;
}

interface InventoryItem extends AdSlot {
  episode_title: string;
  episode_duration: number;
  podcast_name: string;
  podcast_category: string;
  podcaster_name: string;
  podcaster_email: string;
}

export class InventoryService {
  async browseInventory(filters: InventoryFilters, page: number = 1, limit: number = 20): Promise<{ slots: InventoryItem[]; total: number }> {
    try {
      const offset = (page - 1) * limit;
      const whereClauses: string[] = ['a.available = true']; // Only available slots
      const params: any[] = [];
      let paramCount = 0;

      if (filters.category) {
        paramCount++;
        whereClauses.push(`p.category = $${paramCount}`);
        params.push(filters.category);
      }

      if (filters.position) {
        paramCount++;
        whereClauses.push(`a.position = $${paramCount}`);
        params.push(filters.position);
      }

      if (filters.minCpm !== undefined) {
        paramCount++;
        whereClauses.push(`a.cpm_floor >= $${paramCount}`);
        params.push(filters.minCpm);
      }

      if (filters.maxCpm !== undefined) {
        paramCount++;
        whereClauses.push(`a.cpm_floor <= $${paramCount}`);
        params.push(filters.maxCpm);
      }

      if (filters.duration !== undefined) {
        paramCount++;
        whereClauses.push(`a.duration = $${paramCount}`);
        params.push(filters.duration);
      }

      const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

      const [slotsResult, countResult] = await Promise.all([
        query(`
          SELECT 
            a.*,
            e.title as episode_title,
            e.duration as episode_duration,
            p.name as podcast_name,
            p.category as podcast_category,
            u.first_name || ' ' || u.last_name as podcaster_name,
            u.email as podcaster_email
          FROM ad_slots a
          JOIN episodes e ON a.episode_id = e.id
          JOIN podcasts p ON e.podcast_id = p.id
          JOIN users u ON p.owner_id = u.id
          ${whereClause}
          ORDER BY a.created_at DESC
          LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
        `, [...params, limit, offset]),
        
        query(`
          SELECT COUNT(*) as total
          FROM ad_slots a
          JOIN episodes e ON a.episode_id = e.id
          JOIN podcasts p ON e.podcast_id = p.id
          ${whereClause}
        `, params)
      ]);

      return {
        slots: slotsResult.rows,
        total: parseInt(countResult.rows[0].total)
      };
    } catch (error: any) {
      throw new DatabaseError('Failed to browse inventory', error.code);
    }
  }

  async searchInventory(filters: SearchFilters, page: number = 1, limit: number = 20): Promise<{ slots: InventoryItem[]; total: number }> {
    try {
      const offset = (page - 1) * limit;
      const whereClauses: string[] = ['a.available = true'];
      const params: any[] = [];
      let paramCount = 0;

      if (filters.query) {
        paramCount++;
        whereClauses.push(`(
          p.name ILIKE $${paramCount} OR 
          e.title ILIKE $${paramCount} OR 
          p.description ILIKE $${paramCount}
        )`);
        params.push(`%${filters.query}%`);
      }

      if (filters.categories && filters.categories.length > 0) {
        paramCount++;
        whereClauses.push(`p.category = ANY($${paramCount})`);
        params.push(filters.categories);
      }

      if (filters.positions && filters.positions.length > 0) {
        paramCount++;
        whereClauses.push(`a.position = ANY($${paramCount})`);
        params.push(filters.positions);
      }

      if (filters.minCpm !== undefined) {
        paramCount++;
        whereClauses.push(`a.cpm_floor >= $${paramCount}`);
        params.push(filters.minCpm);
      }

      if (filters.maxCpm !== undefined) {
        paramCount++;
        whereClauses.push(`a.cpm_floor <= $${paramCount}`);
        params.push(filters.maxCpm);
      }

      if (filters.minDuration !== undefined) {
        paramCount++;
        whereClauses.push(`a.duration >= $${paramCount}`);
        params.push(filters.minDuration);
      }

      if (filters.maxDuration !== undefined) {
        paramCount++;
        whereClauses.push(`a.duration <= $${paramCount}`);
        params.push(filters.maxDuration);
      }

      const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

      const [slotsResult, countResult] = await Promise.all([
        query(`
          SELECT 
            a.*,
            e.title as episode_title,
            e.duration as episode_duration,
            p.name as podcast_name,
            p.category as podcast_category,
            u.first_name || ' ' || u.last_name as podcaster_name,
            u.email as podcaster_email
          FROM ad_slots a
          JOIN episodes e ON a.episode_id = e.id
          JOIN podcasts p ON e.podcast_id = p.id
          JOIN users u ON p.owner_id = u.id
          ${whereClause}
          ORDER BY a.created_at DESC
          LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
        `, [...params, limit, offset]),
        
        query(`
          SELECT COUNT(*) as total
          FROM ad_slots a
          JOIN episodes e ON a.episode_id = e.id
          JOIN podcasts p ON e.podcast_id = p.id
          ${whereClause}
        `, params)
      ]);

      return {
        slots: slotsResult.rows,
        total: parseInt(countResult.rows[0].total)
      };
    } catch (error: any) {
      throw new DatabaseError('Failed to search inventory', error.code);
    }
  }

  async getInventoryDetails(slotId: string): Promise<InventoryItem | null> {
    try {
      const result = await query(`
        SELECT 
          a.*,
          e.title as episode_title,
          e.description as episode_description,
          e.duration as episode_duration,
          e.published_at,
          p.name as podcast_name,
          p.description as podcast_description,
          p.category as podcast_category,
          u.first_name || ' ' || u.last_name as podcaster_name,
          u.email as podcaster_email,
          u.company_name
        FROM ad_slots a
        JOIN episodes e ON a.episode_id = e.id
        JOIN podcasts p ON e.podcast_id = p.id
        JOIN users u ON p.owner_id = u.id
        WHERE a.id = $1
      `, [slotId]);

      return result.rows[0] || null;
    } catch (error: any) {
      throw new DatabaseError('Failed to get inventory details', error.code);
    }
  }

  async reserveSlot(slotId: string, advertiserId: string, campaignId: string, bidCpm: number): Promise<any> {
    try {
      // Start a transaction
      const client = await query('BEGIN', []);

      try {
        // Check if slot is still available
        const slotResult = await query(`
          SELECT * FROM ad_slots WHERE id = $1 AND available = true
        `, [slotId]);

        if (slotResult.rows.length === 0) {
          throw new ConflictError('Ad slot is no longer available');
        }

        const slot = slotResult.rows[0];

        // Check if bid meets minimum CPM
        if (bidCpm < slot.cpm_floor) {
          throw new ConflictError(`Bid must be at least ${slot.cpm_floor} CPM`);
        }

        // Create booking
        const bookingResult = await query(`
          INSERT INTO bookings (campaign_id, ad_slot_id, cpm_price, status)
          VALUES ($1, $2, $3, 'pending')
          RETURNING *
        `, [campaignId, slotId, bidCpm]);

        // Mark slot as unavailable
        await query(`
          UPDATE ad_slots SET available = false WHERE id = $1
        `, [slotId]);

        await query('COMMIT', []);

        return {
          booking: bookingResult.rows[0],
          slot: slot
        };
      } catch (error) {
        await query('ROLLBACK', []);
        throw error;
      }
    } catch (error: any) {
      if (error instanceof ConflictError) throw error;
      throw new DatabaseError('Failed to reserve slot', error.code);
    }
  }

  async getCategories(): Promise<string[]> {
    try {
      const result = await query(`
        SELECT DISTINCT category 
        FROM podcasts 
        WHERE category IS NOT NULL 
        ORDER BY category
      `, []);

      return result.rows.map(row => row.category);
    } catch (error: any) {
      throw new DatabaseError('Failed to get categories', error.code);
    }
  }

  async getInventoryStats(): Promise<any> {
    try {
      const result = await query(`
        SELECT 
          COUNT(DISTINCT p.id) as total_podcasts,
          COUNT(DISTINCT e.id) as total_episodes,
          COUNT(a.id) as total_slots,
          COUNT(CASE WHEN a.available = true THEN a.id END) as available_slots,
          AVG(a.cpm_floor) as avg_cpm,
          MIN(a.cpm_floor) as min_cpm,
          MAX(a.cpm_floor) as max_cpm
        FROM podcasts p
        JOIN episodes e ON p.id = e.podcast_id
        JOIN ad_slots a ON e.id = a.episode_id
      `, []);

      const stats = result.rows[0];
      return {
        totalPodcasts: parseInt(stats.total_podcasts || '0'),
        totalEpisodes: parseInt(stats.total_episodes || '0'),
        totalSlots: parseInt(stats.total_slots || '0'),
        availableSlots: parseInt(stats.available_slots || '0'),
        averageCpm: parseFloat(stats.avg_cpm || '0'),
        minCpm: parseFloat(stats.min_cpm || '0'),
        maxCpm: parseFloat(stats.max_cpm || '0')
      };
    } catch (error: any) {
      throw new DatabaseError('Failed to get inventory stats', error.code);
    }
  }
}