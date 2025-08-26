import { query } from '../../../../common/middleware';
import { CampaignCreativeAssociation, Creative } from '../../../../common/types';
import { NotFoundError, ConflictError, DatabaseError, AuthorizationError } from '../../../../common/middleware';
import { v4 as uuidv4 } from 'uuid';

export class CampaignCreativeService {
  // Assign existing creative(s) to campaign
  async assignCreativesToCampaign(
    campaignId: string, 
    creativeIds: string[], 
    advertiserId: string
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
          `INSERT INTO campaign_creatives (id, campaign_id, creative_id, assigned_at, assigned_by) 
           VALUES ($1, $2, $3, $4, $5) RETURNING *`,
          [associationId, campaignId, creativeId, timestamp, advertiserId]
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