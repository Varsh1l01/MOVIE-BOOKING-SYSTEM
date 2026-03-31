import { Router } from 'express';
import { getAllCoupons, validateCoupon, createCoupon, updateCoupon, deleteCoupon, getCouponById } from './coupon.controller';
import { authenticate, requireRole } from '../../middleware/authenticate';

const router = Router();

router.get('/', getAllCoupons);
router.post('/validate', authenticate, validateCoupon);
router.get('/:id', authenticate, getCouponById);
router.post('/', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), createCoupon);
router.put('/:id', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), updateCoupon);
router.delete('/:id', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), deleteCoupon);

export default router;
