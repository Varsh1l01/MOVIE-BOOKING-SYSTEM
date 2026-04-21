import { Router } from 'express';
import { getDashboardStats, getAllUsers, getAllBookings, toggleUserActive, syncMovies } from './admin.controller';
import { authenticate, requireRole } from '../../middleware/authenticate';
import {
  createCoupon,
  getAllCoupons,
  getCouponById,
  toggleCoupon,
  updateCoupon,
  deleteCoupon,
} from '../coupons/coupon.controller';

const router = Router();

// All admin routes require authentication + ADMIN/SUPER_ADMIN role
router.use(authenticate, requireRole('ADMIN', 'SUPER_ADMIN'));

// ─── Dashboard & Users ───────────────────────────────────────────────────────
router.get('/dashboard',               getDashboardStats);
router.get('/users',                   getAllUsers);
router.get('/bookings',                getAllBookings);
router.patch('/users/:id/toggle-active', toggleUserActive);
router.post('/sync-movies',            syncMovies);

// ─── Coupon Management ───────────────────────────────────────────────────────
// GET    /api/admin/coupons           — list all coupons (?status=active|expired|inactive)
router.get('/coupons',                 getAllCoupons);
// POST   /api/admin/coupons           — create coupon
router.post('/coupons',                createCoupon);
// GET    /api/admin/coupons/:id       — get single coupon
router.get('/coupons/:id',             getCouponById);
// PATCH  /api/admin/coupons/:id/toggle — activate / deactivate
router.patch('/coupons/:id/toggle',    toggleCoupon);
// PUT    /api/admin/coupons/:id       — update coupon details
router.put('/coupons/:id',             updateCoupon);
// DELETE /api/admin/coupons/:id       — delete coupon
router.delete('/coupons/:id',          deleteCoupon);

export default router;
