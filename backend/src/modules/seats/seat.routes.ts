import { Router } from 'express';
import { getSeatsByShow, lockSeats, unlockSeats } from './seat.controller';
import { authenticate } from '../../middleware/authenticate';

const router = Router();

router.get('/show/:showId', getSeatsByShow);
router.post('/lock', authenticate, lockSeats);
router.post('/unlock', authenticate, unlockSeats);

export default router;
