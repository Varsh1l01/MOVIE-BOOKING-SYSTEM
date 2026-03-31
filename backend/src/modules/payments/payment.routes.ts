import { Router } from 'express';
import { initiatePayment, confirmPayment, getPaymentStatus } from './payment.controller';
import { authenticate } from '../../middleware/authenticate';

const router = Router();

router.use(authenticate);
router.post('/initiate', initiatePayment);
router.post('/confirm', confirmPayment);
router.get('/:bookingId', getPaymentStatus);

export default router;
