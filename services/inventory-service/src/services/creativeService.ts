import { query } from '../../../../common/middleware';
import { NotFoundError, ValidationError, DatabaseError } from '../../../../common/middleware';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';

interface CampaignCreative {
  id: string;
  campaign_id: string;
  name: string;
  file_path: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  creative_type: 'image' | 'audio' | 'video';
  width?: number;
  height?: number;
  duration?: number;
  is_approved: boolean;
  rejection_reason?: string;
  checksum?: string;
  upload_ip?: string;
  created_at: string;
  updated_at: string;
}

interface CreateCreativeData {
  campaign_id: string;
  name: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  creative_type: 'image' | 'audio' | 'video';
  width?: number;
  height?: number;
  duration?: number;
  upload_ip?: string;
}

interface UpdateCreativeData {
  name?: string;
  is_approved?: boolean;
  rejection_reason?: string;
}

export class CreativeService {
  private readonly UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads/creatives';

  /**
   * Create campaign creative record in database
   */
  async createCreative(
    campaignId: string, 
    advertiserId: string, 
    creativeData: CreateCreativeData,
    fileBuffer: Buffer
  ): Promise<CampaignCreative> {
    try {
      // Verify campaign ownership
      const ownershipResult = await query(
        'SELECT id FROM campaigns WHERE id = $1 AND advertiser_id = $2',
        [campaignId, advertiserId]
      );

      if (ownershipResult.rows.length === 0) {
        throw new NotFoundError('Campaign not found or access denied');
      }

      // Generate file path and checksum
      const fileExtension = path.extname(creativeData.file_name);
      const fileName = `${Date.now()}-${crypto.randomUUID()}${fileExtension}`;
      const filePath = `/uploads/creatives/${fileName}`;
      const checksum = crypto.createHash('sha256').update(fileBuffer).digest('hex');

      // Ensure upload directory exists
      await fs.mkdir(path.join(this.UPLOAD_DIR), { recursive: true });
      
      // Save file to disk
      const fullFilePath = path.join(this.UPLOAD_DIR, fileName);
      await fs.writeFile(fullFilePath, fileBuffer);

      // Insert creative record
      const result = await query(`
        INSERT INTO campaign_creatives (
          campaign_id, name, file_path, file_name, file_size, mime_type, 
          creative_type, width, height, duration, checksum, upload_ip
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `, [
        campaignId,
        creativeData.name,
        filePath,
        creativeData.file_name,
        creativeData.file_size,
        creativeData.mime_type,
        creativeData.creative_type,
        creativeData.width,
        creativeData.height,
        creativeData.duration,
        checksum,
        creativeData.upload_ip
      ]);

      return result.rows[0];
    } catch (error: any) {
      if (error instanceof NotFoundError) throw error;
      throw new DatabaseError('Failed to create creative', error.code);
    }
  }

  /**
   * Get all creatives for a campaign
   */
  async getCampaignCreatives(campaignId: string, advertiserId: string): Promise<{
    creatives: CampaignCreative[];
    total: number;
  }> {
    try {
      // Verify campaign ownership
      const ownershipResult = await query(
        'SELECT id FROM campaigns WHERE id = $1 AND advertiser_id = $2',
        [campaignId, advertiserId]
      );

      if (ownershipResult.rows.length === 0) {
        throw new NotFoundError('Campaign not found or access denied');
      }

      const result = await query(`
        SELECT * FROM campaign_creatives 
        WHERE campaign_id = $1 
        ORDER BY created_at DESC
      `, [campaignId]);

      return {
        creatives: result.rows,
        total: result.rows.length
      };
    } catch (error: any) {
      if (error instanceof NotFoundError) throw error;
      throw new DatabaseError('Failed to fetch campaign creatives', error.code);
    }
  }

  /**
   * Get a specific creative by ID
   */
  async getCreativeById(creativeId: string, advertiserId: string): Promise<CampaignCreative | null> {
    try {
      const result = await query(`
        SELECT cc.* FROM campaign_creatives cc
        JOIN campaigns c ON cc.campaign_id = c.id
        WHERE cc.id = $1 AND c.advertiser_id = $2
      `, [creativeId, advertiserId]);

      return result.rows[0] || null;
    } catch (error: any) {
      throw new DatabaseError('Failed to fetch creative', error.code);
    }
  }

  /**
   * Update creative metadata
   */
  async updateCreative(
    creativeId: string, 
    advertiserId: string, 
    updateData: UpdateCreativeData
  ): Promise<CampaignCreative | null> {
    try {
      // Verify creative ownership
      const creative = await this.getCreativeById(creativeId, advertiserId);
      if (!creative) {
        throw new NotFoundError('Creative not found or access denied');
      }

      const setClause = [];
      const values = [];
      let paramCount = 0;

      if (updateData.name !== undefined) {
        paramCount++;
        setClause.push(`name = $${paramCount}`);
        values.push(updateData.name);
      }

      if (updateData.is_approved !== undefined) {
        paramCount++;
        setClause.push(`is_approved = $${paramCount}`);
        values.push(updateData.is_approved);
      }

      if (updateData.rejection_reason !== undefined) {
        paramCount++;
        setClause.push(`rejection_reason = $${paramCount}`);
        values.push(updateData.rejection_reason);
      }

      if (setClause.length === 0) {
        return creative; // No updates
      }

      // Add updated_at
      paramCount++;
      setClause.push(`updated_at = $${paramCount}`);
      values.push(new Date());

      // Add WHERE clause parameters
      paramCount++;
      values.push(creativeId);

      const result = await query(`
        UPDATE campaign_creatives 
        SET ${setClause.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `, values);

      return result.rows[0] || null;
    } catch (error: any) {
      if (error instanceof NotFoundError) throw error;
      throw new DatabaseError('Failed to update creative', error.code);
    }
  }

  /**
   * Delete a creative and its file
   */
  async deleteCreative(creativeId: string, advertiserId: string): Promise<boolean> {
    try {
      // Get creative to delete file
      const creative = await this.getCreativeById(creativeId, advertiserId);
      if (!creative) {
        throw new NotFoundError('Creative not found or access denied');
      }

      // Delete from database first
      const result = await query(`
        DELETE FROM campaign_creatives cc
        USING campaigns c
        WHERE cc.id = $1 AND cc.campaign_id = c.id AND c.advertiser_id = $2
      `, [creativeId, advertiserId]);

      if (result.rowCount === 0) {
        return false;
      }

      // Try to delete file (don't fail if file doesn't exist)
      try {
        const fullFilePath = path.join(this.UPLOAD_DIR, path.basename(creative.file_path));
        await fs.unlink(fullFilePath);
      } catch (fileError) {
        console.warn(`Failed to delete file ${creative.file_path}:`, fileError);
      }

      return true;
    } catch (error: any) {
      if (error instanceof NotFoundError) throw error;
      throw new DatabaseError('Failed to delete creative', error.code);
    }
  }

  /**
   * Get creative file for download
   */
  async getCreativeFile(creativeId: string, advertiserId: string): Promise<{
    creative: CampaignCreative;
    filePath: string;
  }> {
    try {
      const creative = await this.getCreativeById(creativeId, advertiserId);
      if (!creative) {
        throw new NotFoundError('Creative not found or access denied');
      }

      const fullFilePath = path.resolve(this.UPLOAD_DIR, path.basename(creative.file_path));
      
      // Check if file exists
      try {
        await fs.access(fullFilePath);
      } catch {
        throw new NotFoundError('Creative file not found on disk');
      }

      return {
        creative,
        filePath: fullFilePath
      };
    } catch (error: any) {
      if (error instanceof NotFoundError) throw error;
      throw new DatabaseError('Failed to get creative file', error.code);
    }
  }

  /**
   * Validate creative file based on type and specifications
   */
  validateCreative(file: Express.Multer.File): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // File size limits (in bytes)
    const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
    const MAX_AUDIO_SIZE = 50 * 1024 * 1024; // 50MB  
    const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB

    // Allowed MIME types
    const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/ogg'];
    const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg'];

    // File extension mappings (fallback when MIME detection fails)
    const EXTENSION_TYPE_MAP: { [key: string]: string } = {
      '.jpg': 'image', '.jpeg': 'image', '.png': 'image', '.gif': 'image', '.webp': 'image',
      '.mp3': 'audio', '.m4a': 'audio', '.wav': 'audio', '.ogg': 'audio',
      '.mp4': 'video', '.webm': 'video', '.ogv': 'video'
    };

    // Get file extension
    const fileExtension = path.extname(file.originalname).toLowerCase();

    // Determine creative type from MIME type first, then fallback to extension
    let creativeType: string;
    if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      creativeType = 'image';
    } else if (ALLOWED_AUDIO_TYPES.includes(file.mimetype)) {
      creativeType = 'audio';
    } else if (ALLOWED_VIDEO_TYPES.includes(file.mimetype)) {
      creativeType = 'video';
    } else if (fileExtension && EXTENSION_TYPE_MAP[fileExtension]) {
      // Fallback to file extension when MIME type is not recognized
      creativeType = EXTENSION_TYPE_MAP[fileExtension];
    } else {
      errors.push(`Unsupported file type: ${file.mimetype} (extension: ${fileExtension})`);
      return { isValid: false, errors };
    }

    // Validate file size based on determined type
    if (creativeType === 'image' && file.size > MAX_IMAGE_SIZE) {
      errors.push(`Image file too large. Maximum size: ${MAX_IMAGE_SIZE / (1024 * 1024)}MB`);
    } else if (creativeType === 'audio' && file.size > MAX_AUDIO_SIZE) {
      errors.push(`Audio file too large. Maximum size: ${MAX_AUDIO_SIZE / (1024 * 1024)}MB`);
    } else if (creativeType === 'video' && file.size > MAX_VIDEO_SIZE) {
      errors.push(`Video file too large. Maximum size: ${MAX_VIDEO_SIZE / (1024 * 1024)}MB`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}