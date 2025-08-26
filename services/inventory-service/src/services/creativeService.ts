import { query } from '../../../../common/middleware';
import { Creative } from '../../../../common/types';
import { NotFoundError, ConflictError, DatabaseError, AuthorizationError } from '../../../../common/middleware';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

interface CreateCreativeData {
  name: string;
  creative_type?: 'image' | 'audio' | 'video';
  width?: number;
  height?: number;
  duration?: number;
}

interface UpdateCreativeData {
  name?: string;
  creative_type?: 'image' | 'audio' | 'video';
  width?: number;
  height?: number;
  duration?: number;
}

export class CreativeService {
  validateCreative(file: Express.Multer.File): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

    if (file.size > MAX_FILE_SIZE) {
      errors.push('File size exceeds 500MB limit');
    }

    const ALLOWED_MIMES = {
      'image': ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
      'audio': ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a'],
      'video': ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/webm']
    };

    const EXTENSION_TYPE_MAP: { [key: string]: string } = {
      '.jpg': 'image', '.jpeg': 'image', '.png': 'image', '.gif': 'image', '.webp': 'image',
      '.mp3': 'audio', '.wav': 'audio', '.ogg': 'audio', '.m4a': 'audio',
      '.mp4': 'video', '.avi': 'video', '.mov': 'video', '.wmv': 'video', '.webm': 'video'
    };

    let detectedType: string | undefined;
    let mimeValid = false;

    // First try MIME type detection
    for (const [type, mimes] of Object.entries(ALLOWED_MIMES)) {
      if (mimes.includes(file.mimetype)) {
        detectedType = type;
        mimeValid = true;
        break;
      }
    }

    // Fallback to extension-based detection if MIME fails
    if (!mimeValid) {
      const ext = path.extname(file.originalname).toLowerCase();
      detectedType = EXTENSION_TYPE_MAP[ext];
      
      if (detectedType) {
        console.log(`MIME fallback: ${file.originalname} detected as ${detectedType} (MIME: ${file.mimetype})`);
        mimeValid = true;
      }
    }

    if (!mimeValid) {
      errors.push(`Unsupported file type: ${file.mimetype}. Allowed types: images, audio, video`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private detectCreativeType(file: Express.Multer.File): 'image' | 'audio' | 'video' {
    const EXTENSION_TYPE_MAP: { [key: string]: 'image' | 'audio' | 'video' } = {
      '.jpg': 'image', '.jpeg': 'image', '.png': 'image', '.gif': 'image', '.webp': 'image',
      '.mp3': 'audio', '.wav': 'audio', '.ogg': 'audio', '.m4a': 'audio',
      '.mp4': 'video', '.avi': 'video', '.mov': 'video', '.wmv': 'video', '.webm': 'video'
    };

    // Try MIME type first
    if (file.mimetype.startsWith('image/')) return 'image';
    if (file.mimetype.startsWith('audio/')) return 'audio';
    if (file.mimetype.startsWith('video/')) return 'video';

    // Fallback to extension
    const ext = path.extname(file.originalname).toLowerCase();
    return EXTENSION_TYPE_MAP[ext] || 'image';
  }

  private async calculateChecksum(filePath: string): Promise<string> {
    const fileBuffer = await fs.readFile(filePath);
    return crypto.createHash('sha256').update(fileBuffer).digest('hex');
  }

  async createCreative(
    advertiserId: string,
    file: Express.Multer.File,
    data: CreateCreativeData,
    uploadIp?: string
  ): Promise<Creative> {
    try {
      const creativeId = uuidv4();
      const timestamp = new Date().toISOString();
      
      // Create unique filename to prevent conflicts
      const fileExt = path.extname(file.originalname);
      const uniqueFileName = `${creativeId}${fileExt}`;
      const relativePath = `/uploads/creatives/${uniqueFileName}`;
      const fullPath = path.resolve(process.cwd(), 'uploads', 'creatives', uniqueFileName);

      // Ensure upload directory exists
      const uploadDir = path.dirname(fullPath);
      await fs.mkdir(uploadDir, { recursive: true });

      // Move uploaded file to permanent location
      await fs.writeFile(fullPath, file.buffer);

      // Calculate file checksum
      const checksum = await this.calculateChecksum(fullPath);

      // Auto-detect creative type if not provided
      const creativeType = data.creative_type || this.detectCreativeType(file);

      const queryText = `
        INSERT INTO creatives (
          id, advertiser_id, name, file_path, file_name, file_size, mime_type, creative_type,
          width, height, duration, checksum, upload_ip, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING *
      `;

      const values = [
        creativeId,
        advertiserId,
        data.name,
        relativePath,
        file.originalname,
        file.size,
        file.mimetype,
        creativeType,
        data.width || null,
        data.height || null,
        data.duration || null,
        checksum,
        uploadIp || null,
        timestamp,
        timestamp
      ];

      const result = await query(queryText, values);
      return result.rows[0];
    } catch (error: any) {
      console.error('Error creating creative:', error);
      throw new DatabaseError('Failed to create creative');
    }
  }

  async getAdvertiserCreatives(advertiserId: string, page = 1, limit = 20): Promise<{ creatives: Creative[]; total: number }> {
    try {
      const offset = (page - 1) * limit;

      const countResult = await query('SELECT COUNT(*) FROM creatives WHERE advertiser_id = $1', [advertiserId]);
      const total = parseInt(countResult.rows[0].count);

      const queryText = `
        SELECT * FROM creatives 
        WHERE advertiser_id = $1 
        ORDER BY created_at DESC 
        LIMIT $2 OFFSET $3
      `;
      
      const result = await query(queryText, [advertiserId, limit, offset]);
      
      return {
        creatives: result.rows,
        total
      };
    } catch (error: any) {
      console.error('Error fetching advertiser creatives:', error);
      throw new DatabaseError('Failed to fetch creatives');
    }
  }

  async getCreativeById(id: string, advertiserId: string): Promise<Creative | null> {
    try {
      const result = await query('SELECT * FROM creatives WHERE id = $1 AND advertiser_id = $2', [id, advertiserId]);
      return result.rows[0] || null;
    } catch (error: any) {
      console.error('Error fetching creative by ID:', error);
      throw new DatabaseError('Failed to fetch creative');
    }
  }

  async updateCreative(id: string, advertiserId: string, data: UpdateCreativeData): Promise<Creative | null> {
    try {
      const updates: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (data.name !== undefined) {
        updates.push(`name = $${paramCount++}`);
        values.push(data.name);
      }

      if (data.creative_type !== undefined) {
        updates.push(`creative_type = $${paramCount++}`);
        values.push(data.creative_type);
      }

      if (data.width !== undefined) {
        updates.push(`width = $${paramCount++}`);
        values.push(data.width);
      }

      if (data.height !== undefined) {
        updates.push(`height = $${paramCount++}`);
        values.push(data.height);
      }

      if (data.duration !== undefined) {
        updates.push(`duration = $${paramCount++}`);
        values.push(data.duration);
      }

      if (updates.length === 0) {
        return this.getCreativeById(id, advertiserId);
      }

      updates.push(`updated_at = $${paramCount++}`);
      values.push(new Date().toISOString());

      values.push(id, advertiserId);

      const queryText = `
        UPDATE creatives 
        SET ${updates.join(', ')}
        WHERE id = $${paramCount++} AND advertiser_id = $${paramCount++}
        RETURNING *
      `;

      const result = await query(queryText, values);
      return result.rows[0] || null;
    } catch (error: any) {
      console.error('Error updating creative:', error);
      throw new DatabaseError('Failed to update creative');
    }
  }

  async deleteCreative(id: string, advertiserId: string): Promise<boolean> {
    try {
      // First get the creative to find the file path
      const creative = await this.getCreativeById(id, advertiserId);
      if (!creative) return false;

      // Check if creative is used in any campaigns
      const usageResult = await query('SELECT COUNT(*) FROM campaign_creatives WHERE creative_id = $1', [id]);
      const usageCount = parseInt(usageResult.rows[0].count);
      
      if (usageCount > 0) {
        throw new ConflictError('Cannot delete creative that is assigned to campaigns');
      }

      // Delete from database first
      const result = await query('DELETE FROM creatives WHERE id = $1 AND advertiser_id = $2', [id, advertiserId]);

      if (result.rowCount === 0) return false;

      // Delete physical file
      try {
        const fullPath = path.resolve(process.cwd(), creative.file_path.substring(1)); // Remove leading /
        await fs.unlink(fullPath);
      } catch (error) {
        console.error('Failed to delete creative file:', error);
        // Don't fail the entire operation if file deletion fails
      }

      return true;
    } catch (error: any) {
      if (error instanceof ConflictError) {
        throw error;
      }
      console.error('Error deleting creative:', error);
      throw new DatabaseError('Failed to delete creative');
    }
  }

  async getCreativeFile(id: string, advertiserId: string): Promise<{ filePath: string; fileName: string; mimeType: string } | null> {
    try {
      const creative = await this.getCreativeById(id, advertiserId);
      if (!creative) return null;

      const fullPath = path.resolve(process.cwd(), creative.file_path.substring(1)); // Remove leading /
      
      return {
        filePath: fullPath,
        fileName: creative.file_name,
        mimeType: creative.mime_type
      };
    } catch (error: any) {
      console.error('Error getting creative file:', error);
      throw new DatabaseError('Failed to get creative file');
    }
  }
}