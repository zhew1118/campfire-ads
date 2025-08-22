import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.json({ campaigns: [] });
});

router.post('/', (req, res) => {
  res.status(201).json({ message: 'Campaign created', campaign: { id: '1', ...req.body } });
});

router.get('/:id', (req, res) => {
  res.json({ campaign: { id: req.params.id, name: 'Sample Campaign' } });
});

router.put('/:id', (req, res) => {
  res.json({ message: 'Campaign updated', campaign: { id: req.params.id, ...req.body } });
});

router.delete('/:id', (req, res) => {
  res.json({ message: 'Campaign deleted' });
});

router.get('/:id/performance', (req, res) => {
  res.json({ performance: { impressions: 0, clicks: 0, ctr: 0 } });
});

router.post('/:id/pause', (req, res) => {
  res.json({ message: 'Campaign status updated' });
});

export default router;