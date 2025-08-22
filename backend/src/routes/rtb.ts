import { Router } from 'express';

const router = Router();

router.post('/bid', (req, res) => {
  res.json({ 
    bid_response: {
      id: req.body.id || 'bid-1',
      bid_price: 100,
      currency: 'USD'
    }
  });
});

router.post('/win', (req, res) => {
  res.json({ message: 'Win notification received' });
});

router.post('/impression', (req, res) => {
  res.json({ message: 'Impression tracked' });
});

router.post('/click', (req, res) => {
  res.json({ message: 'Click tracked' });
});

export default router;