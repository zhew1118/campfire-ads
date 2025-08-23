import { query } from '../../../../common/middleware';
import { User, Podcast } from '../../../../common/types';
import { NotFoundError, ConflictError, DatabaseError } from '../../../../common/middleware';

export class PodcasterService {
  async getAllPodcasters(page: number = 1, limit: number = 20): Promise<{ podcasters: User[]; total: number }> {
    try {
      const offset = (page - 1) * limit;
      
      const [podcasters, countResult] = await Promise.all([
        query(`
          SELECT 
            u.id, u.email, u.first_name, u.last_name, u.company_name,
            u.created_at, u.updated_at,
            COUNT(DISTINCT p.id) as total_podcasts,
            COUNT(DISTINCT e.id) as total_episodes,
            COALESCE(SUM(b.cpm_price * CASE WHEN b.status = 'delivered' THEN 1 ELSE 0 END), 0) as total_earnings_cents
          FROM users u
          LEFT JOIN podcasts p ON u.id = p.podcaster_id
          LEFT JOIN episodes e ON p.id = e.podcast_id
          LEFT JOIN ad_slots a ON e.id = a.episode_id  
          LEFT JOIN bookings b ON a.id = b.ad_slot_id
          WHERE u.role = 'podcaster'
          GROUP BY u.id, u.email, u.first_name, u.last_name, u.company_name, u.created_at, u.updated_at
          ORDER BY u.created_at DESC
          LIMIT $1 OFFSET $2
        `, [limit, offset]),
        
        query(`
          SELECT COUNT(*) FROM users WHERE role = 'podcaster'
        `, [])
      ]);

      // Convert earnings to cents
      const processedPodcasters = podcasters.rows.map(row => ({
        ...row,
        name: `${row.first_name || ''} ${row.last_name || ''}`.trim() || row.company_name,
        total_earnings_cents: Math.round(parseFloat(row.total_earnings_cents || '0') * 100)
      }));

      return {
        podcasters: processedPodcasters,
        total: parseInt(countResult.rows[0].count)
      };
    } catch (error: any) {
      throw new DatabaseError('Failed to fetch podcasters', error.code);
    }
  }

  async getPodcasterById(id: string): Promise<User | null> {
    try {
      const result = await query(`
        SELECT 
          u.id, u.email, u.first_name, u.last_name, u.company_name,
          u.created_at, u.updated_at,
          COUNT(DISTINCT p.id) as total_podcasts,
          COUNT(DISTINCT e.id) as total_episodes,
          COALESCE(SUM(b.cpm_price * CASE WHEN b.status = 'delivered' THEN 1 ELSE 0 END), 0) as total_earnings_cents
        FROM users u
        LEFT JOIN podcasts p ON u.id = p.owner_id
        LEFT JOIN episodes e ON p.id = e.podcast_id
        LEFT JOIN ad_slots a ON e.id = a.episode_id  
        LEFT JOIN bookings b ON a.id = b.ad_slot_id
        WHERE u.role = 'podcaster' AND u.id = $1
        GROUP BY u.id, u.email, u.first_name, u.last_name, u.company_name, u.created_at, u.updated_at
      `, [id]);

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        ...row,
        name: `${row.first_name || ''} ${row.last_name || ''}`.trim() || row.company_name,
        total_earnings_cents: Math.round(parseFloat(row.total_earnings_cents || '0') * 100)
      };
    } catch (error: any) {
      throw new DatabaseError('Failed to fetch podcaster', error.code);
    }
  }

  async createPodcaster(data: { email: string; password_hash: string; first_name?: string; last_name?: string; company_name?: string }): Promise<User> {
    try {
      const result = await query(`
        INSERT INTO users (email, password_hash, role, first_name, last_name, company_name)
        VALUES ($1, $2, 'podcaster', $3, $4, $5)
        RETURNING *
      `, [data.email, data.password_hash, data.first_name, data.last_name, data.company_name]);

      const user = result.rows[0];
      return {
        ...user,
        name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.company_name,
        total_earnings_cents: 0
      };
    } catch (error: any) {
      if (error.code === '23505') {
        throw new ConflictError('Email already exists');
      }
      throw new DatabaseError('Failed to create podcaster', error.code);
    }
  }

  async updatePodcaster(id: string, data: { first_name?: string; last_name?: string; company_name?: string }): Promise<User | null> {
    try {
      const setParts: string[] = [];
      const values: any[] = [];
      let paramCount = 0;

      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined) {
          paramCount++;
          setParts.push(`${key} = $${paramCount}`);
          values.push(value);
        }
      });

      if (setParts.length === 0) {
        return this.getPodcasterById(id);
      }

      values.push(new Date()); // updated_at
      paramCount++;
      setParts.push(`updated_at = $${paramCount}`);

      values.push(id); // WHERE condition
      const idParam = paramCount + 1;

      const result = await query(`
        UPDATE users 
        SET ${setParts.join(', ')}
        WHERE id = $${idParam} AND role = 'podcaster'
        RETURNING *
      `, values);

      if (result.rows.length === 0) {
        return null;
      }

      const user = result.rows[0];
      return {
        ...user,
        name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.company_name,
        total_earnings_cents: 0 // Would need additional query to get earnings
      };
    } catch (error: any) {
      throw new DatabaseError('Failed to update podcaster', error.code);
    }
  }

  async deletePodcaster(id: string): Promise<boolean> {
    try {
      const result = await query(`
        DELETE FROM users 
        WHERE id = $1 AND role = 'podcaster'
      `, [id]);

      return result.rowCount > 0;
    } catch (error: any) {
      throw new DatabaseError('Failed to delete podcaster', error.code);
    }
  }

  async getPodcasterPodcasts(podcasterId: string, page: number = 1, limit: number = 20): Promise<{ podcasts: Podcast[]; total: number }> {
    try {
      const offset = (page - 1) * limit;
      
      const [podcasts, countResult] = await Promise.all([
        query(`
          SELECT p.*, 
                 COUNT(DISTINCT e.id) as episode_count,
                 COUNT(DISTINCT a.id) as ad_slot_count,
                 COUNT(DISTINCT CASE WHEN a.available = true THEN a.id END) as available_slot_count
          FROM podcasts p
          LEFT JOIN episodes e ON p.id = e.podcast_id
          LEFT JOIN ad_slots a ON e.id = a.episode_id
          WHERE p.owner_id = $1
          GROUP BY p.id
          ORDER BY p.created_at DESC
          LIMIT $2 OFFSET $3
        `, [podcasterId, limit, offset]),
        
        query(`
          SELECT COUNT(*) FROM podcasts WHERE owner_id = $1
        `, [podcasterId])
      ]);

      return {
        podcasts: podcasts.rows,
        total: parseInt(countResult.rows[0].count)
      };
    } catch (error: any) {
      throw new DatabaseError('Failed to fetch podcaster podcasts', error.code);
    }
  }
}