import { query } from '../../../../common/middleware';
import { CampaignCreativeAssociation, Creative } from '../../../../common/types';
import { NotFoundError, ConflictError, DatabaseError, AuthorizationError } from '../../../../common/middleware';
import { v4 as uuidv4 } from 'uuid';

interface CampaignCreativeData {
  weight?: number;
  flight_start?: string;
  flight_end?: string;
  position?: string;
  frequency_cap_per_episode?: number;
  notes?: string;
}

export class CampaignCreativeService {
  // Assign existing creative(s) to campaign
  async assignCreativesToCampaign(
    campaignId: string, 
    creativeIds: string[], 
    advertiserId: string,
    additionalData?: CampaignCreativeData
  ): Promise<CampaignCreativeAssociation[]> {
    try {
      // First verify campaign ownership
      const campaignResult = await query('SELECT id FROM campaigns WHERE id = $1 AND advertiser_id = $2', [campaignId, advertiserId]);
      if (campaignResult.rows.length === 0) {
        throw new NotFoundError('Campaign not found or access denied');
      }

      // Verify all creatives belong to the advertiser
      const creativesResult = await query(
        'SELECT id FROM creatives WHERE id = ANY($1) AND advertiser_id = $2',
        [creativeIds, advertiserId]
      );
      
      if (creativesResult.rows.length !== creativeIds.length) {
        throw new NotFoundError('One or more creatives not found or access denied');
      }

      // Check for existing associations
      const existingResult = await query(
        'SELECT creative_id FROM campaign_creatives WHERE campaign_id = $1 AND creative_id = ANY($2)',
        [campaignId, creativeIds]
      );
      
      if (existingResult.rows.length > 0) {
        const duplicateIds = existingResult.rows.map((row: any) => row.creative_id);
        throw new ConflictError(`Creatives already assigned to campaign: ${duplicateIds.join(', ')}`);
      }

      // Create associations
      const associations: CampaignCreativeAssociation[] = [];
      const timestamp = new Date().toISOString();

      for (const creativeId of creativeIds) {
        const associationId = uuidv4();
        const result = await query(
          `INSERT INTO campaign_creatives (
             id, campaign_id, creative_id, assigned_at, assigned_by,
             weight, flight_start, flight_end, position, frequency_cap_per_episode, notes
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
          [
            associationId, 
            campaignId, 
            creativeId, 
            timestamp, 
            advertiserId,
            additionalData?.weight || 100,
            additionalData?.flight_start || null,
            additionalData?.flight_end || null,
            additionalData?.position || null,
            additionalData?.frequency_cap_per_episode || null,
            additionalData?.notes || null
          ]
        );
        associations.push(result.rows[0]);
      }

      return associations;
    } catch (error: any) {
      if (error instanceof NotFoundError || error instanceof ConflictError) {
        throw error;
      }
      console.error('Error assigning creatives to campaign:', error);
      throw new DatabaseError('Failed to assign creatives to campaign');
    }
  }

  // Get creatives assigned to campaign
  async getCampaignCreatives(campaignId: string, advertiserId: string): Promise<Creative[]> {
    try {
      // Verify campaign ownership
      const campaignResult = await query('SELECT id FROM campaigns WHERE id = $1 AND advertiser_id = $2', [campaignId, advertiserId]);
      if (campaignResult.rows.length === 0) {
        throw new NotFoundError('Campaign not found or access denied');
      }

      const result = await query(`
        SELECT c.* 
        FROM creatives c
        INNER JOIN campaign_creatives cc ON c.id = cc.creative_id
        WHERE cc.campaign_id = $1
        ORDER BY cc.assigned_at DESC
      `, [campaignId]);

      return result.rows;
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      console.error('Error fetching campaign creatives:', error);
      throw new DatabaseError('Failed to fetch campaign creatives');
    }
  }

  // Remove creative from campaign
  async unassignCreativeFromCampaign(
    campaignId: string, 
    creativeId: string, 
    advertiserId: string
  ): Promise<boolean> {
    try {
      // Verify campaign ownership
      const campaignResult = await query('SELECT id FROM campaigns WHERE id = $1 AND advertiser_id = $2', [campaignId, advertiserId]);
      if (campaignResult.rows.length === 0) {
        throw new NotFoundError('Campaign not found or access denied');
      }

      // Verify creative ownership
      const creativeResult = await query('SELECT id FROM creatives WHERE id = $1 AND advertiser_id = $2', [creativeId, advertiserId]);
      if (creativeResult.rows.length === 0) {
        throw new NotFoundError('Creative not found or access denied');
      }

      // Remove association
      const result = await query(
        'DELETE FROM campaign_creatives WHERE campaign_id = $1 AND creative_id = $2',
        [campaignId, creativeId]
      );

      return result.rowCount > 0;
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      console.error('Error unassigning creative from campaign:', error);
      throw new DatabaseError('Failed to unassign creative from campaign');
    }
  }

  // Update campaign creative association
  async updateCampaignCreative(
    campaignId: string,
    creativeId: string,
    advertiserId: string,
    data: CampaignCreativeData
  ): Promise<CampaignCreativeAssociation | null> {
    try {
      // Verify campaign and creative ownership
      const campaignResult = await query('SELECT id FROM campaigns WHERE id = $1 AND advertiser_id = $2', [campaignId, advertiserId]);
      if (campaignResult.rows.length === 0) {
        throw new NotFoundError('Campaign not found or access denied');
      }

      const creativeResult = await query('SELECT id FROM creatives WHERE id = $1 AND advertiser_id = $2', [creativeId, advertiserId]);
      if (creativeResult.rows.length === 0) {
        throw new NotFoundError('Creative not found or access denied');
      }

      // Build update query dynamically
      const updates: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (data.weight !== undefined) {
        updates.push(`weight = $${paramCount++}`);
        values.push(data.weight);
      }

      if (data.flight_start !== undefined) {
        updates.push(`flight_start = $${paramCount++}`);
        values.push(data.flight_start);
      }

      if (data.flight_end !== undefined) {
        updates.push(`flight_end = $${paramCount++}`);
        values.push(data.flight_end);
      }

      if (data.position !== undefined) {
        updates.push(`position = $${paramCount++}`);
        values.push(data.position);
      }

      if (data.frequency_cap_per_episode !== undefined) {
        updates.push(`frequency_cap_per_episode = $${paramCount++}`);
        values.push(data.frequency_cap_per_episode);
      }

      if (data.notes !== undefined) {
        updates.push(`notes = $${paramCount++}`);
        values.push(data.notes);
      }

      if (updates.length === 0) {
        // Return existing association if no updates
        const result = await query(
          'SELECT * FROM campaign_creatives WHERE campaign_id = $1 AND creative_id = $2',
          [campaignId, creativeId]
        );
        return result.rows[0] || null;
      }

      // Add campaign_id and creative_id to values for WHERE clause
      values.push(campaignId, creativeId);

      const queryText = `
        UPDATE campaign_creatives 
        SET ${updates.join(', ')}
        WHERE campaign_id = $${paramCount++} AND creative_id = $${paramCount++}
        RETURNING *
      `;

      const result = await query(queryText, values);
      return result.rows[0] || null;
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      console.error('Error updating campaign creative:', error);
      throw new DatabaseError('Failed to update campaign creative');
    }
  }

  // Get all campaigns using a specific creative
  async getCreativeUsage(creativeId: string, advertiserId: string): Promise<any[]> {
    try {
      // Verify creative ownership
      const creativeResult = await query('SELECT id FROM creatives WHERE id = $1 AND advertiser_id = $2', [creativeId, advertiserId]);
      if (creativeResult.rows.length === 0) {
        throw new NotFoundError('Creative not found or access denied');
      }

      const result = await query(`
        SELECT c.id, c.name, c.status, cc.assigned_at
        FROM campaigns c
        INNER JOIN campaign_creatives cc ON c.id = cc.campaign_id
        WHERE cc.creative_id = $1 AND c.advertiser_id = $2
        ORDER BY cc.assigned_at DESC
      `, [creativeId, advertiserId]);

      return result.rows;
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      console.error('Error fetching creative usage:', error);
      throw new DatabaseError('Failed to fetch creative usage');
    }
  }
}