import { query } from '../../../../common/middleware/database';
import { Episode } from '../../../../common/types';
import { v4 as uuidv4 } from 'uuid';

export interface CreateEpisodeData {
  title: string;
  description?: string;
  duration: number;
  audio_url: string;
  file_size?: number;
  episode_number?: number;
  season_number?: number;
  published_at?: string;
  status?: 'draft' | 'published' | 'archived';
}

export interface UpdateEpisodeData {
  title?: string;
  description?: string;
  duration?: number;
  audio_url?: string;
  file_size?: number;
  episode_number?: number;
  season_number?: number;
  published_at?: string;
  status?: 'draft' | 'published' | 'archived';
}

export class EpisodeService {

  async getEpisodeById(episodeId: string, userId?: string): Promise<Episode | null> {
    const queryStr = `
      SELECT 
        e.id,
        e.podcast_id,
        e.title,
        e.description,
        e.duration,
        e.audio_url,
        e.file_size,
        e.episode_number,
        e.season_number,
        e.published_at,
        e.status,
        e.created_at,
        e.updated_at,
        p.name as podcast_name,
        p.podcaster_id
      FROM episodes e
      JOIN podcasts p ON e.podcast_id = p.id
      WHERE e.id = $1
      ${userId ? 'AND p.podcaster_id = $2' : ''}
    `;

    const params = userId ? [episodeId, userId] : [episodeId];
    const result = await query(queryStr, params);
    
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  async getPodcastEpisodes(podcastId: string, userId?: string, page: number = 1, limit: number = 20): Promise<{episodes: Episode[], total: number}> {
    // First check if user has access to this podcast
    if (userId) {
      const podcastQuery = 'SELECT id FROM podcasts WHERE id = $1 AND podcaster_id = $2';
      const podcastResult = await query(podcastQuery, [podcastId, userId]);
      if (podcastResult.rows.length === 0) {
        return { episodes: [], total: 0 };
      }
    }

    const offset = (page - 1) * limit;

    const countQuery = `
      SELECT COUNT(*) 
      FROM episodes e
      JOIN podcasts p ON e.podcast_id = p.id
      WHERE e.podcast_id = $1
    `;

    const queryStr = `
      SELECT 
        e.id,
        e.podcast_id,
        e.title,
        e.description,
        e.duration,
        e.audio_url,
        e.file_size,
        e.episode_number,
        e.season_number,
        e.published_at,
        e.status,
        e.created_at,
        e.updated_at,
        p.name as podcast_name
      FROM episodes e
      JOIN podcasts p ON e.podcast_id = p.id
      WHERE e.podcast_id = $1
      ORDER BY e.published_at DESC NULLS LAST, e.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const [countResult, episodesResult] = await Promise.all([
      query(countQuery, [podcastId]),
      query(queryStr, [podcastId, limit, offset])
    ]);

    return {
      episodes: episodesResult.rows,
      total: parseInt(countResult.rows[0].count)
    };
  }

  async createEpisode(podcastId: string, userId: string, data: CreateEpisodeData): Promise<Episode> {
    // First verify user owns the podcast
    const podcastQuery = 'SELECT id FROM podcasts WHERE id = $1 AND podcaster_id = $2';
    const podcastResult = await query(podcastQuery, [podcastId, userId]);
    
    if (podcastResult.rows.length === 0) {
      throw new Error('Podcast not found or access denied');
    }

    const episodeId = uuidv4();
    const now = new Date().toISOString();

    const queryStr = `
      INSERT INTO episodes (
        id, podcast_id, title, description, duration, audio_url, file_size,
        episode_number, season_number, published_at, status, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $12)
      RETURNING *
    `;

    const params = [
      episodeId,
      podcastId,
      data.title,
      data.description || null,
      data.duration,
      data.audio_url,
      data.file_size || null,
      data.episode_number || null,
      data.season_number || null,
      data.published_at || null,
      data.status || 'draft',
      now
    ];

    const result = await query(queryStr, params);
    return result.rows[0];
  }

  async updateEpisode(episodeId: string, userId: string, data: UpdateEpisodeData): Promise<Episode | null> {
    // First verify user owns the episode's podcast
    const verifyQuery = `
      SELECT e.id 
      FROM episodes e
      JOIN podcasts p ON e.podcast_id = p.id
      WHERE e.id = $1 AND p.podcaster_id = $2
    `;
    const verifyResult = await query(verifyQuery, [episodeId, userId]);
    
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
      return this.getEpisodeById(episodeId, userId);
    }

    updateFields.push(`updated_at = $${paramCount}`);
    values.push(new Date().toISOString());
    paramCount++;

    values.push(episodeId);

    const queryStr = `
      UPDATE episodes 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await query(queryStr, values);
    return result.rows[0];
  }

  async deleteEpisode(episodeId: string, userId: string): Promise<boolean> {
    // First verify user owns the episode's podcast
    const verifyQuery = `
      SELECT e.id 
      FROM episodes e
      JOIN podcasts p ON e.podcast_id = p.id
      WHERE e.id = $1 AND p.podcaster_id = $2
    `;
    const verifyResult = await query(verifyQuery, [episodeId, userId]);
    
    if (verifyResult.rows.length === 0) {
      return false;
    }

    const queryStr = 'DELETE FROM episodes WHERE id = $1';
    const result = await query(queryStr, [episodeId]);
    
    return result.rowCount > 0;
  }
}