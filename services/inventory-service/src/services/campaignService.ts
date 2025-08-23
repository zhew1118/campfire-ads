import { query } from '../../../../common/middleware';
import { Campaign } from '../../../../common/types';
import { NotFoundError, ConflictError, DatabaseError, AuthorizationError } from '../../../../common/middleware';

interface CreateCampaignData {
  name: string;
  description?: string;
  budget_cents: number;
  daily_budget_cents?: number;
  start_date: string;
  end_date: string;
  targeting: {
    categories: string[];
    demographics?: {
      age_range?: string;
      gender?: string;
      interests?: string[];
    };
    geo?: {
      countries?: string[];
      regions?: string[];
      exclude_countries?: string[];
    };
  };
  bid_strategy: 'cpm' | 'cpc' | 'cpa';
  max_bid_cents: number;
}

interface UpdateCampaignData {
  name?: string;
  description?: string;
  daily_budget_cents?: number;
  end_date?: string;
  targeting?: any;
  bid_strategy?: 'cpm' | 'cpc' | 'cpa';
  max_bid_cents?: number;
  status?: 'draft' | 'active' | 'paused' | 'completed';
}

export class CampaignService {
  async getUserCampaigns(userId: string, userRole: string, page: number = 1, limit: number = 20): Promise<{ campaigns: Campaign[]; total: number }> {
    try {
      const offset = (page - 1) * limit;
      let whereClause = '';
      let params: any[] = [limit, offset];
      let countParams: any[] = [];
      
      if (userRole === 'advertiser') {
        whereClause = 'WHERE advertiser_id = $3';
        params.push(userId);
        countParams = [userId];
      } else if (userRole !== 'admin') {
        throw new AuthorizationError('Insufficient permissions to view campaigns');
      }
      
      const [campaigns, countResult] = await Promise.all([
        query(`
          SELECT 
            c.*,
            u.first_name || ' ' || u.last_name as advertiser_name,
            u.company_name
          FROM campaigns c
          JOIN users u ON c.advertiser_id = u.id
          ${whereClause}
          ORDER BY c.created_at DESC
          LIMIT $1 OFFSET $2
        `, params),
        
        query(`
          SELECT COUNT(*) FROM campaigns c ${whereClause}
        `, countParams)
      ]);

      return {
        campaigns: campaigns.rows,
        total: parseInt(countResult.rows[0].count)
      };
    } catch (error: any) {
      if (error instanceof AuthorizationError) throw error;
      throw new DatabaseError('Failed to fetch user campaigns', error.code);
    }
  }

  async createCampaign(advertiserId: string, userRole: string, data: CreateCampaignData): Promise<Campaign> {
    try {
      if (userRole !== 'advertiser' && userRole !== 'admin') {
        throw new AuthorizationError('Only advertisers can create campaigns');
      }

      // Convert budget from cents for storage (our DB stores as decimal)
      const budgetDecimal = data.budget_cents / 100;
      const maxBidDecimal = data.max_bid_cents / 100;
      const dailyBudgetDecimal = data.daily_budget_cents ? data.daily_budget_cents / 100 : null;

      const result = await query(`
        INSERT INTO campaigns (
          advertiser_id, name, description, budget, spent, max_cpm, 
          target_categories, status, start_date, end_date
        )
        VALUES ($1, $2, $3, $4, 0, $5, $6, 'draft', $7, $8)
        RETURNING *
      `, [
        advertiserId,
        data.name,
        data.description,
        budgetDecimal,
        maxBidDecimal,
        data.targeting.categories,
        data.start_date,
        data.end_date
      ]);

      const campaign = result.rows[0];
      
      // Convert back to cents for API response
      campaign.budget_cents = Math.round(campaign.budget * 100);
      campaign.spent_cents = Math.round(campaign.spent * 100);
      delete campaign.budget;
      delete campaign.spent;

      return campaign;
    } catch (error: any) {
      if (error instanceof AuthorizationError) throw error;
      throw new DatabaseError('Failed to create campaign', error.code);
    }
  }

  async getCampaignById(id: string, userId?: string, userRole?: string): Promise<Campaign | null> {
    try {
      let query_text = `
        SELECT 
          c.*,
          u.first_name || ' ' || u.last_name as advertiser_name,
          u.company_name,
          u.email as advertiser_email
        FROM campaigns c
        JOIN users u ON c.advertiser_id = u.id
        WHERE c.id = $1
      `;
      const params = [id];

      // Add access control if user context provided
      if (userId && userRole === 'advertiser') {
        query_text += ' AND c.advertiser_id = $2';
        params.push(userId);
      }

      const result = await query(query_text, params);
      
      if (result.rows.length === 0) {
        return null;
      }

      const campaign = result.rows[0];
      
      // Convert to cents for API response
      campaign.budget_cents = Math.round(campaign.budget * 100);
      campaign.spent_cents = Math.round(campaign.spent * 100);
      delete campaign.budget;
      delete campaign.spent;

      return campaign;
    } catch (error: any) {
      throw new DatabaseError('Failed to fetch campaign', error.code);
    }
  }

  async updateCampaign(id: string, userId: string, userRole: string, data: UpdateCampaignData): Promise<Campaign | null> {
    try {
      // Check ownership/permission
      const existingCampaign = await this.getCampaignById(id, userId, userRole);
      if (!existingCampaign) {
        throw new NotFoundError('Campaign not found or access denied');
      }

      const setParts: string[] = [];
      const values: any[] = [];
      let paramCount = 0;

      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined) {
          paramCount++;
          if (key === 'daily_budget_cents') {
            // Convert cents to decimal for storage - but we don't store daily_budget in current schema
            // This would need a schema update
            return;
          }
          if (key === 'max_bid_cents') {
            setParts.push(`max_cpm = $${paramCount}`);
            values.push(value / 100); // Convert to decimal
          } else if (key === 'targeting') {
            setParts.push(`target_categories = $${paramCount}`);
            values.push(value.categories || []);
          } else {
            setParts.push(`${key} = $${paramCount}`);
            values.push(value);
          }
        }
      });

      if (setParts.length === 0) {
        return existingCampaign;
      }

      values.push(new Date()); // updated_at
      paramCount++;
      setParts.push(`updated_at = $${paramCount}`);

      values.push(id); // WHERE condition
      const idParam = paramCount + 1;

      const result = await query(`
        UPDATE campaigns 
        SET ${setParts.join(', ')}
        WHERE id = $${idParam}
        RETURNING *
      `, values);

      if (result.rows.length === 0) {
        return null;
      }

      const campaign = result.rows[0];
      
      // Convert to cents for API response
      campaign.budget_cents = Math.round(campaign.budget * 100);
      campaign.spent_cents = Math.round(campaign.spent * 100);
      delete campaign.budget;
      delete campaign.spent;

      return campaign;
    } catch (error: any) {
      if (error instanceof NotFoundError) throw error;
      throw new DatabaseError('Failed to update campaign', error.code);
    }
  }

  async deleteCampaign(id: string, userId: string, userRole: string): Promise<boolean> {
    try {
      let query_text = 'DELETE FROM campaigns WHERE id = $1';
      const params = [id];

      // Add access control for non-admin users
      if (userRole === 'advertiser') {
        query_text += ' AND advertiser_id = $2';
        params.push(userId);
      } else if (userRole !== 'admin') {
        throw new AuthorizationError('Insufficient permissions to delete campaigns');
      }

      const result = await query(query_text, params);
      return result.rowCount > 0;
    } catch (error: any) {
      if (error instanceof AuthorizationError) throw error;
      throw new DatabaseError('Failed to delete campaign', error.code);
    }
  }

  async activateCampaign(id: string, userId: string, userRole: string): Promise<Campaign | null> {
    try {
      const campaign = await this.getCampaignById(id, userId, userRole);
      if (!campaign) {
        throw new NotFoundError('Campaign not found or access denied');
      }

      const result = await query(`
        UPDATE campaigns 
        SET status = 'active', updated_at = $1
        WHERE id = $2
        RETURNING *
      `, [new Date(), id]);

      if (result.rows.length === 0) {
        return null;
      }

      const updatedCampaign = result.rows[0];
      
      // Convert to cents for API response
      updatedCampaign.budget_cents = Math.round(updatedCampaign.budget * 100);
      updatedCampaign.spent_cents = Math.round(updatedCampaign.spent * 100);
      delete updatedCampaign.budget;
      delete updatedCampaign.spent;

      return updatedCampaign;
    } catch (error: any) {
      if (error instanceof NotFoundError) throw error;
      throw new DatabaseError('Failed to activate campaign', error.code);
    }
  }

  async pauseCampaign(id: string, userId: string, userRole: string): Promise<Campaign | null> {
    try {
      const campaign = await this.getCampaignById(id, userId, userRole);
      if (!campaign) {
        throw new NotFoundError('Campaign not found or access denied');
      }

      const result = await query(`
        UPDATE campaigns 
        SET status = 'paused', updated_at = $1
        WHERE id = $2
        RETURNING *
      `, [new Date(), id]);

      if (result.rows.length === 0) {
        return null;
      }

      const updatedCampaign = result.rows[0];
      
      // Convert to cents for API response
      updatedCampaign.budget_cents = Math.round(updatedCampaign.budget * 100);
      updatedCampaign.spent_cents = Math.round(updatedCampaign.spent * 100);
      delete updatedCampaign.budget;
      delete updatedCampaign.spent;

      return updatedCampaign;
    } catch (error: any) {
      if (error instanceof NotFoundError) throw error;
      throw new DatabaseError('Failed to pause campaign', error.code);
    }
  }
}