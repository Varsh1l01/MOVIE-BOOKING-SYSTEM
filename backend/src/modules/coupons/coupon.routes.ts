import { Router } from 'express';
import {
  // Admin
  createCoupon,
  getAllCoupons,
  getCouponById,
  toggleCoupon,
  updateCoupon,
  deleteCoupon,
  // User
  applyCoupon,
  getActiveCoupons,
} from './coupon.controller';
import { authenticate, requireRole } from '../../middleware/authenticate';

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC / USER ROUTES
// ─────────────────────────────────────────────────────────────────────────────

// Browse active coupons (for display purposes — no sensitive data)
router.get('/', getActiveCoupons);

// Apply a coupon during checkout — requires login
router.post('/apply', authenticate, applyCoupon);

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN ROUTES — require ADMIN or SUPER_ADMIN role
// ─────────────────────────────────────────────────────────────────────────────
const adminOnly = [authenticate, requireRole('ADMIN', 'SUPER_ADMIN')];

// GET  /api/coupons/admin         — list all coupons (with ?status=active|expired|inactive)
router.get('/admin',          ...adminOnly, getAllCoupons);

// POST /api/coupons/admin         — create a new coupon
router.post('/admin',         ...adminOnly, createCoupon);

// GET  /api/coupons/admin/:id     — get one coupon by id
router.get('/admin/:id',      ...adminOnly, getCouponById);

// PATCH /api/coupons/admin/:id/toggle — activate / deactivate
router.patch('/admin/:id/toggle', ...adminOnly, toggleCoupon);

// PUT  /api/coupons/admin/:id     — full update
router.put('/admin/:id',      ...adminOnly, updateCoupon);

// DELETE /api/coupons/admin/:id   — delete coupon
router.delete('/admin/:id',   ...adminOnly, deleteCoupon);

export default router;
