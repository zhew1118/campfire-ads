import { Router } from 'express';
import { 
  AuthenticatedRequest, 
  createValidator, 
  commonSchemas,
  validators,
  asyncHandler,
  NotFoundError
} from '../../../../common/middleware';
import { APIResponse } from '../../../../common/types';
import { PodcastService } from '../services/podcastService';
import { EpisodeService } from '../services/episodeService';

const router = Router();
const validator = createValidator();
const podcastService = new PodcastService();
const episodeService = new EpisodeService();

// GET /podcasts - List podcaster's podcasts
router.get('/', 
  validators.pagination,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    console.log('DEBUG - Query:', req.query);
    console.log('DEBUG - User:', req.user);
    const userId = req.query.user_id as string || req.user?.id;
    console.log('DEBUG - userId:', userId);
    
    if (!userId) {
      throw new NotFoundError('User ID required');
    }

    const { page = 1, limit = 20 } = req.query as any;
    const result = await podcastService.getUserPodcasts(userId, page, limit);
    
    const response: APIResponse = {
      status: 'success',
      timestamp: new Date().toISOString(),
      data: {
        podcasts: result.podcasts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: result.total,
          totalPages: Math.ceil(result.total / limit)
        }
      }
    };
    
    res.json(response);
  })
);

// POST /podcasts - Create a new podcast
router.post('/',
  validator.validate({
    body: commonSchemas.podcast.create
  }),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.body.created_by || req.user?.id;
    
    if (!userId) {
      throw new NotFoundError('User ID required');
    }

    const podcast = await podcastService.createPodcast(userId, req.body);
    
    const response: APIResponse = {
      status: 'success',
      timestamp: new Date().toISOString(),
      data: podcast
    };
    
    res.status(201).json(response);
  })
);

// GET /podcasts/:id - Get a specific podcast
router.get('/:id',
  validators.validateId('id'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id;
    const podcast = await podcastService.getPodcastById(req.params.id, userId);
    
    if (!podcast) {
      throw new NotFoundError('Podcast not found');
    }
    
    const response: APIResponse = {
      status: 'success',
      timestamp: new Date().toISOString(),
      data: podcast
    };
    
    res.json(response);
  })
);

// PUT /podcasts/:id - Update a podcast
router.put('/:id',
  validators.validateId('id'),
  validator.validate({
    body: commonSchemas.podcast.update
  }),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id || req.body.user_id;
    
    if (!userId) {
      throw new NotFoundError('User ID required');
    }

    const podcast = await podcastService.updatePodcast(req.params.id, userId, req.body);
    
    if (!podcast) {
      throw new NotFoundError('Podcast not found or access denied');
    }
    
    const response: APIResponse = {
      status: 'success',
      timestamp: new Date().toISOString(),
      data: podcast
    };
    
    res.json(response);
  })
);

// DELETE /podcasts/:id - Delete a podcast
router.delete('/:id',
  validators.validateId('id'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id || req.body.user_id;
    
    if (!userId) {
      throw new NotFoundError('User ID required');
    }

    const deleted = await podcastService.deletePodcast(req.params.id, userId);
    
    if (!deleted) {
      throw new NotFoundError('Podcast not found or access denied');
    }
    
    res.status(204).send();
  })
);

// GET /podcasts/:id/episodes - List episodes for a podcast
router.get('/:id/episodes',
  validators.validateId('id'),
  validators.pagination,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id;
    const { page = 1, limit = 20 } = req.query as any;
    
    const result = await episodeService.getPodcastEpisodes(req.params.id, userId, page, limit);
    
    const response: APIResponse = {
      status: 'success',
      timestamp: new Date().toISOString(),
      data: {
        episodes: result.episodes,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: result.total,
          totalPages: Math.ceil(result.total / limit)
        }
      }
    };
    
    res.json(response);
  })
);

// POST /podcasts/:id/episodes - Create an episode for a podcast
router.post('/:id/episodes',
  validators.validateId('id'),
  validator.validate({
    body: commonSchemas.episode.create
  }),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id || req.body.user_id;
    
    if (!userId) {
      throw new NotFoundError('User ID required');
    }

    const episode = await episodeService.createEpisode(req.params.id, userId, req.body);
    
    const response: APIResponse = {
      status: 'success',
      timestamp: new Date().toISOString(),
      data: episode
    };
    
    res.status(201).json(response);
  })
);

export { router as podcastRoutes };