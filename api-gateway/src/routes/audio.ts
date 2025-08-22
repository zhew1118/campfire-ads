import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { HTTPClient } from '../services/httpClient';

const router = Router();
const audioService = new HTTPClient('audio');

router.post('/insert', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const insertionData = {
      ...req.body,
      requested_by: req.user?.id,
      timestamp: new Date().toISOString()
    };
    
    const response = await audioService.post('/insert', insertionData, {
      timeout: 10000
    });
    
    res.status(202).json({
      job_id: response.data.job_id,
      status: 'processing',
      estimated_completion: response.data.estimated_completion,
      status_url: `/api/audio/status/${response.data.job_id}`
    });
  } catch (error: any) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || 'Failed to start audio insertion'
    });
  }
});

router.get('/status/:jobId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const response = await audioService.get(`/status/${req.params.jobId}`);
    
    const statusData = {
      job_id: req.params.jobId,
      status: response.data.status,
      progress: response.data.progress,
      created_at: response.data.created_at,
      updated_at: response.data.updated_at,
      ...(response.data.status === 'completed' && {
        download_url: `/api/audio/download/${req.params.jobId}`
      }),
      ...(response.data.status === 'failed' && {
        error: response.data.error
      })
    };
    
    res.json(statusData);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || 'Failed to get processing status'
    });
  }
});

router.get('/download/:jobId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const statusResponse = await audioService.get(`/status/${req.params.jobId}`);
    
    if (statusResponse.data.status !== 'completed') {
      return res.status(400).json({
        error: 'Audio processing not completed',
        status: statusResponse.data.status
      });
    }
    
    const downloadResponse = await audioService.get(`/download/${req.params.jobId}`, {
      responseType: 'stream'
    });
    
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', `attachment; filename="processed-${req.params.jobId}.mp3"`);
    
    downloadResponse.data.pipe(res);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || 'Failed to download processed audio'
    });
  }
});

router.post('/upload', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const uploadData = {
      ...req.body,
      uploaded_by: req.user?.id
    };
    
    const response = await audioService.post('/upload', uploadData);
    res.status(201).json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || 'Failed to upload audio creative'
    });
  }
});

router.get('/creative/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const response = await audioService.get(`/creative/${req.params.id}`, {
      responseType: 'stream'
    });
    
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    
    response.data.pipe(res);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || 'Failed to get audio creative'
    });
  }
});

export default router;