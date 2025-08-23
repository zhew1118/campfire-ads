import { query } from '../../../../common/middleware/database';
import { AdSlot } from '../../../../common/types';
import { v4 as uuidv4 } from 'uuid';

export interface CreateAdSlotData {
  position: 'pre_roll' | 'mid_roll' | 'post_roll';
  duration: number;
  cpm_floor: number;
  available?: boolean;
  start_time?: number;
}

export interface UpdateAdSlotData {
  position?: 'pre_roll' | 'mid_roll' | 'post_roll';
  duration?: number;
  cpm_floor?: number;
  available?: boolean;
  start_time?: number;
}

export interface UpdatePricingData {
  cpm_floor: number;
}

export class AdSlotService {

  async getAdSlotById(slotId: string, userId?: string): Promise<AdSlot | null> {
    const queryStr = `
      SELECT 
        a.id,
        a.episode_id,
        a.position,
        a.duration,
        a.cpm_floor,
        a.available,
        a.start_time,
        a.created_at,
        a.updated_at,
        e.title as episode_title,
        p.name as podcast_name,
        p.podcaster_id
      FROM ad_slots a
      JOIN episodes e ON a.episode_id = e.id
      JOIN podcasts p ON e.podcast_id = p.id
      WHERE a.id = $1
      ${userId ? 'AND p.podcaster_id = $2' : ''}
    `;

    const params = userId ? [slotId, userId] : [slotId];
    const result = await query(queryStr, params);
    
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  async getEpisodeAdSlots(episodeId: string, userId?: string): Promise<AdSlot[]> {
    // First check if user has access to this episode's podcast
    if (userId) {
      const episodeQuery = `
        SELECT e.id 
        FROM episodes e
        JOIN podcasts p ON e.podcast_id = p.id
        WHERE e.id = $1 AND p.podcaster_id = $2
      `;
      const episodeResult = await query(episodeQuery, [episodeId, userId]);
      if (episodeResult.rows.length === 0) {
        return [];
      }
    }

    const queryStr = `
      SELECT 
        a.id,
        a.episode_id,
        a.position,
        a.duration,
        a.cpm_floor,
        a.available,
        a.start_time,
        a.created_at,
        a.updated_at,
        e.title as episode_title,
        p.name as podcast_name
      FROM ad_slots a
      JOIN episodes e ON a.episode_id = e.id
      JOIN podcasts p ON e.podcast_id = p.id
      WHERE a.episode_id = $1
      ORDER BY 
        CASE a.position
          WHEN 'pre_roll' THEN 1
          WHEN 'mid_roll' THEN 2
          WHEN 'post_roll' THEN 3
        END,
        a.start_time ASC NULLS FIRST,
        a.created_at ASC
    `;

    const result = await query(queryStr, [episodeId]);
    return result.rows;
  }

  async createAdSlot(episodeId: string, userId: string, data: CreateAdSlotData): Promise<AdSlot> {
    // First verify user owns the episode's podcast
    const episodeQuery = `
      SELECT e.id 
      FROM episodes e
      JOIN podcasts p ON e.podcast_id = p.id
      WHERE e.id = $1 AND p.podcaster_id = $2
    `;
    const episodeResult = await query(episodeQuery, [episodeId, userId]);
    
    if (episodeResult.rows.length === 0) {
      throw new Error('Episode not found or access denied');
    }

    const slotId = uuidv4();
    const now = new Date().toISOString();

    const queryStr = `
      INSERT INTO ad_slots (
        id, episode_id, position, duration, cpm_floor, available, start_time, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)
      RETURNING *
    `;

    const params = [
      slotId,
      episodeId,
      data.position,
      data.duration,
      data.cpm_floor,
      data.available !== undefined ? data.available : true,
      data.start_time || null,
      now
    ];

    const result = await query(queryStr, params);
    return result.rows[0];
  }

  async updateAdSlot(slotId: string, userId: string, data: UpdateAdSlotData): Promise<AdSlot | null> {
    // First verify user owns the ad slot's episode's podcast
    const verifyQuery = `
      SELECT a.id 
      FROM ad_slots a
      JOIN episodes e ON a.episode_id = e.id
      JOIN podcasts p ON e.podcast_id = p.id
      WHERE a.id = $1 AND p.podcaster_id = $2
    `;
    const verifyResult = await query(verifyQuery, [slotId, userId]);
    
    if (verifyResult.rows.length === 0) {
      return null;
    }

    const updateFields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    // Build dynamic update query
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    if (updateFields.length === 0) {
      // No fields to update, just return current data
      return this.getAdSlotById(slotId, userId);
    }

    updateFields.push(`updated_at = $${paramCount}`);
    values.push(new Date().toISOString());
    paramCount++;

    values.push(slotId);

    const queryStr = `
      UPDATE ad_slots 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await query(queryStr, values);
    return result.rows[0];
  }

  async updatePricing(slotId: string, userId: string, data: UpdatePricingData): Promise<AdSlot | null> {
    return this.updateAdSlot(slotId, userId, { cpm_floor: data.cpm_floor });
  }

  async deleteAdSlot(slotId: string, userId: string): Promise<boolean> {
    // First verify user owns the ad slot's episode's podcast
    const verifyQuery = `
      SELECT a.id 
      FROM ad_slots a
      JOIN episodes e ON a.episode_id = e.id
      JOIN podcasts p ON e.podcast_id = p.id
      WHERE a.id = $1 AND p.podcaster_id = $2
    `;
    const verifyResult = await query(verifyQuery, [slotId, userId]);
    
    if (verifyResult.rows.length === 0) {
      return false;
    }

    const queryStr = 'DELETE FROM ad_slots WHERE id = $1';
    const result = await query(queryStr, [slotId]);
    
    return result.rowCount > 0;
  }

  async getAvailableSlots(filters: {
    category?: string;
    position?: 'pre_roll' | 'mid_roll' | 'post_roll';
    min_duration?: number;
    max_duration?: number;
    max_cpm?: number;
  } = {}): Promise<AdSlot[]> {
    let whereConditions = ['a.available = true'];
    const params: any[] = [];
    let paramCount = 1;

    if (filters.category) {
      whereConditions.push(`p.category = $${paramCount}`);
      params.push(filters.category);
      paramCount++;
    }

    if (filters.position) {
      whereConditions.push(`a.position = $${paramCount}`);
      params.push(filters.position);
      paramCount++;
    }

    if (filters.min_duration) {
      whereConditions.push(`a.duration >= $${paramCount}`);
      params.push(filters.min_duration);
      paramCount++;
    }

    if (filters.max_duration) {
      whereConditions.push(`a.duration <= $${paramCount}`);
      params.push(filters.max_duration);
      paramCount++;
    }

    if (filters.max_cpm) {
      whereConditions.push(`a.cpm_floor <= $${paramCount}`);
      params.push(filters.max_cpm);
      paramCount++;
    }

    const queryStr = `
      SELECT 
        a.id,
        a.episode_id,
        a.position,
        a.duration,
        a.cpm_floor,
        a.available,
        a.start_time,
        a.created_at,
        a.updated_at,
        e.title as episode_title,
        p.id as podcast_id,
        p.name as podcast_name,
        p.category,
        p.podcaster_id
      FROM ad_slots a
      JOIN episodes e ON a.episode_id = e.id
      JOIN podcasts p ON e.podcast_id = p.id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY a.cpm_floor ASC, a.created_at DESC
    `;

    const result = await query(queryStr, params);
    return result.rows;
  }
}