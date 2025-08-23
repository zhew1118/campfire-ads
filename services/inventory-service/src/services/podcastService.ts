import { query } from '../../../../common/middleware';
import { Podcast } from '../../../../common/types';
import { NotFoundError, ConflictError, DatabaseError } from '../../../../common/middleware';

export class PodcastService {
  async getAllPodcasts(page: number = 1, limit: number = 20, category?: string): Promise<{ podcasts: Podcast[]; total: number }> {
    try {
      const offset = (page - 1) * limit;
      let whereClause = 'WHERE status = $1';
      let params: any[] = ['active'];
      
      if (category) {
        whereClause += ' AND category = $2';
        params.push(category);
      }
      
      const limitOffset = category ? '$3 OFFSET $4' : '$2 OFFSET $3';
      const limitOffsetValues = category ? [limit, offset] : [limit, offset];
      
      const [podcasts, countResult] = await Promise.all([
        query(`
          SELECT p.*, u.first_name, u.last_name, u.company_name
          FROM podcasts p
          JOIN users u ON p.podcaster_id = u.id
          ${whereClause}
          ORDER BY p.created_at DESC
          LIMIT ${limitOffset}
        `, [...params, ...limitOffsetValues]),
        
        query(`
          SELECT COUNT(*) FROM podcasts p ${whereClause}
        `, params)
      ]);

      return {
        podcasts: podcasts.rows,
        total: parseInt(countResult.rows[0].count)
      };
    } catch (error: any) {
      throw new DatabaseError('Failed to fetch podcasts', error.code);
    }
  }

  async getUserPodcasts(userId: string, page: number = 1, limit: number = 20): Promise<{ podcasts: Podcast[]; total: number }> {
    try {
      const offset = (page - 1) * limit;
      
      const [podcasts, countResult] = await Promise.all([
        query(`
          SELECT * FROM podcasts 
          WHERE podcaster_id = $1 
          ORDER BY created_at DESC
          LIMIT $2 OFFSET $3
        `, [userId, limit, offset]),
        
        query(`
          SELECT COUNT(*) FROM podcasts WHERE podcaster_id = $1
        `, [userId])
      ]);

      return {
        podcasts: podcasts.rows,
        total: parseInt(countResult.rows[0].count)
      };
    } catch (error: any) {
      throw new DatabaseError('Failed to fetch user podcasts', error.code);
    }
  }

  async createPodcast(userId: string, data: { title: string; description?: string; rss_feed_url: string; category: string; explicit?: boolean; language?: string; website?: string; author?: string }): Promise<Podcast> {
    try {
      const result = await query(`
        INSERT INTO podcasts (name, description, category, rss_url, podcaster_id, status)
        VALUES ($1, $2, $3, $4, $5, 'active')
        RETURNING *
      `, [data.title, data.description, data.category, data.rss_feed_url, userId]);

      return result.rows[0];
    } catch (error: any) {
      if (error.code === '23505') {
        throw new ConflictError('Podcast with this RSS feed already exists');
      }
      throw new DatabaseError('Failed to create podcast', error.code);
    }
  }

  async getPodcastById(id: string, userId?: string): Promise<Podcast | null> {
    try {
      let queryStr = 'SELECT * FROM podcasts WHERE id = $1';
      let params = [id];
      
      if (userId) {
        queryStr += ' AND podcaster_id = $2';
        params.push(userId);
      }
      
      const result = await query(queryStr, params);

      return result.rows[0] || null;
    } catch (error: any) {
      throw new DatabaseError('Failed to fetch podcast', error.code);
    }
  }

  async updatePodcast(id: string, userId: string, data: { title?: string; description?: string; category?: string; explicit?: boolean; website?: string; author?: string }): Promise<Podcast | null> {
    try {
      const setParts: string[] = [];
      const values: any[] = [];
      let paramCount = 0;

      if (data.title !== undefined) {
        paramCount++;
        setParts.push(`name = $${paramCount}`);
        values.push(data.title);
      }

      if (data.description !== undefined) {
        paramCount++;
        setParts.push(`description = $${paramCount}`);
        values.push(data.description);
      }

      if (data.category !== undefined) {
        paramCount++;
        setParts.push(`category = $${paramCount}`);
        values.push(data.category);
      }

      // Note: explicit, website, author are not in our current DB schema
      // They would need to be added to the podcasts table if needed

      if (setParts.length === 0) {
        return this.getPodcastById(id);
      }

      values.push(new Date(), id, userId);
      paramCount++;
      setParts.push(`updated_at = $${paramCount}`);

      const result = await query(`
        UPDATE podcasts 
        SET ${setParts.join(', ')}
        WHERE id = $${paramCount + 1} AND podcaster_id = $${paramCount + 2}
        RETURNING *
      `, values);

      return result.rows[0] || null;
    } catch (error: any) {
      throw new DatabaseError('Failed to update podcast', error.code);
    }
  }

  async deletePodcast(id: string, userId: string): Promise<boolean> {
    try {
      const result = await query(`
        DELETE FROM podcasts 
        WHERE id = $1 AND podcaster_id = $2
      `, [id, userId]);

      return result.rowCount > 0;
    } catch (error: any) {
      throw new DatabaseError('Failed to delete podcast', error.code);
    }
  }

  async getPodcastStats(id: string, userId: string): Promise<{
    totalEpisodes: number;
    totalAdSlots: number;
    availableSlots: number;
    totalEarnings: number;
  }> {
    try {
      // First verify the user owns this podcast
      const podcast = await this.getPodcastById(id);
      if (!podcast || podcast.podcaster_id !== userId) {
        throw new NotFoundError('Podcast not found');
      }

      const result = await query(`
        SELECT 
          COUNT(DISTINCT e.id) as total_episodes,
          COUNT(DISTINCT a.id) as total_ad_slots,
          COUNT(DISTINCT CASE WHEN a.available = true THEN a.id END) as available_slots,
          COALESCE(SUM(b.cpm_price * CASE WHEN b.status = 'delivered' THEN 1 ELSE 0 END), 0) as total_earnings
        FROM podcasts p
        LEFT JOIN episodes e ON p.id = e.podcast_id
        LEFT JOIN ad_slots a ON e.id = a.episode_id
        LEFT JOIN bookings b ON a.id = b.ad_slot_id
        WHERE p.id = $1
      `, [id]);

      const stats = result.rows[0];
      return {
        totalEpisodes: parseInt(stats.total_episodes || '0'),
        totalAdSlots: parseInt(stats.total_ad_slots || '0'),
        availableSlots: parseInt(stats.available_slots || '0'),
        totalEarnings: parseFloat(stats.total_earnings || '0')
      };
    } catch (error: any) {
      if (error instanceof NotFoundError) throw error;
      throw new DatabaseError('Failed to fetch podcast stats', error.code);
    }
  }
}