import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.json({ podcasts: [] });
});

router.post('/', (req, res) => {
  res.status(201).json({ message: 'Podcast created', podcast: { id: '1', ...req.body } });
});

router.get('/:id', (req, res) => {
  res.json({ podcast: { id: req.params.id, title: 'Sample Podcast' } });
});

router.put('/:id', (req, res) => {
  res.json({ message: 'Podcast updated', podcast: { id: req.params.id, ...req.body } });
});

router.delete('/:id', (req, res) => {
  res.json({ message: 'Podcast deleted' });
});

router.get('/:id/episodes', (req, res) => {
  res.json({ episodes: [] });
});

router.post('/:id/sync', (req, res) => {
  res.json({ message: 'RSS feed sync initiated' });
});

router.get('/:id/analytics', (req, res) => {
  res.json({ analytics: { revenue: 0, impressions: 0 } });
});

export default router;