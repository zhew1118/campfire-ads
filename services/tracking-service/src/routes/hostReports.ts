import { Router, Request, Response, NextFunction } from 'express';
import { query } from '../../../../common/middleware/database';
import { AuthenticatedRequest } from '../../../../common/middleware';

export const hostReportsRouter = Router();

// POST /api/host-reports - Submit host-verified download stats
hostReportsRouter.post('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { 
      placementId, 
      sourceHost, 
      evidenceUrl, 
      periodStart, 
      periodEnd, 
      downloads 
    } = req.body;

    // Validate required fields
    if (!placementId || !downloads || !periodStart || !periodEnd) {
      return res.status(400).json({
        error: 'Missing required fields: placementId, downloads, periodStart, periodEnd'
      });
    }

    // Validate that placement exists and user has access to it
    const placementCheck = await query(`
      SELECT p.id, c.advertiser_id, po.podcaster_id
      FROM placements p
      JOIN campaigns c ON c.id = p.campaign_id
      JOIN ad_slots s ON s.id = p.slot_id
      JOIN episodes e ON e.id = s.episode_id
      JOIN podcasts po ON po.id = e.podcast_id
      WHERE p.id = $1
    `, [placementId]);

    if (!placementCheck.rows[0]) {
      return res.status(404).json({ error: 'Placement not found' });
    }

    const placement = placementCheck.rows[0];
    
    // Check if user owns the campaign (advertiser) or podcast (podcaster)
    if (placement.advertiser_id !== userId && placement.podcaster_id !== userId) {
      return res.status(403).json({ 
        error: 'Access denied - you can only report on your own placements' 
      });
    }

    // Insert host report
    const result = await query(`
      INSERT INTO host_reports (
        placement_id, source_host, evidence_url, 
        period_start, period_end, downloads
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [
      placementId,
      sourceHost,
      evidenceUrl,
      periodStart,
      periodEnd,
      parseInt(downloads)
    ]);

    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/host-reports - List host reports for authenticated user
hostReportsRouter.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = (page - 1) * limit;

    // Get host reports for user's placements (either as advertiser or podcaster)
    const result = await query(`
      SELECT 
        hr.*,
        p.tracking_key,
        c.name as campaign_name,
        po.name as podcast_title
      FROM host_reports hr
      JOIN placements p ON p.id = hr.placement_id
      JOIN campaigns c ON c.id = p.campaign_id
      JOIN ad_slots s ON s.id = p.slot_id
      JOIN episodes e ON e.id = s.episode_id
      JOIN podcasts po ON po.id = e.podcast_id
      WHERE c.advertiser_id = $1 OR po.podcaster_id = $1
      ORDER BY hr.created_at DESC
      LIMIT $2 OFFSET $3
    `, [userId, limit, offset]);

    // Get total count
    const countResult = await query(`
      SELECT COUNT(*)
      FROM host_reports hr
      JOIN placements p ON p.id = hr.placement_id
      JOIN campaigns c ON c.id = p.campaign_id
      JOIN ad_slots s ON s.id = p.slot_id
      JOIN episodes e ON e.id = s.episode_id
      JOIN podcasts po ON po.id = e.podcast_id
      WHERE c.advertiser_id = $1 OR po.podcaster_id = $1
    `, [userId]);

    const totalCount = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasMore: page < totalPages
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/host-reports/:id - Get specific host report
hostReportsRouter.get('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const result = await query(`
      SELECT 
        hr.*,
        p.tracking_key,
        c.name as campaign_name,
        po.name as podcast_title,
        e.title as episode_title
      FROM host_reports hr
      JOIN placements p ON p.id = hr.placement_id
      JOIN campaigns c ON c.id = p.campaign_id
      JOIN ad_slots s ON s.id = p.slot_id
      JOIN episodes e ON e.id = s.episode_id
      JOIN podcasts po ON po.id = e.podcast_id
      WHERE hr.id = $1 AND (c.advertiser_id = $2 OR po.podcaster_id = $2)
    `, [id, userId]);

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Host report not found' });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/host-reports/:id - Update host report (if needed)
hostReportsRouter.put('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { sourceHost, evidenceUrl, downloads } = req.body;

    // Verify user has access to this report
    const accessCheck = await query(`
      SELECT hr.id
      FROM host_reports hr
      JOIN placements p ON p.id = hr.placement_id
      JOIN campaigns c ON c.id = p.campaign_id
      JOIN ad_slots s ON s.id = p.slot_id
      JOIN episodes e ON e.id = s.episode_id
      JOIN podcasts po ON po.id = e.podcast_id
      WHERE hr.id = $1 AND (c.advertiser_id = $2 OR po.podcaster_id = $2)
    `, [id, userId]);

    if (!accessCheck.rows[0]) {
      return res.status(404).json({ error: 'Host report not found' });
    }

    // Update the report
    const result = await query(`
      UPDATE host_reports 
      SET 
        source_host = COALESCE($2, source_host),
        evidence_url = COALESCE($3, evidence_url),
        downloads = COALESCE($4, downloads),
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `, [id, sourceHost, evidenceUrl, downloads ? parseInt(downloads) : null]);

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
});