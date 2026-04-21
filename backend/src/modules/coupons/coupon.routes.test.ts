import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import { signAccessToken } from '../../utils/jwt';

// ─── Mock Prisma ────────────────────────────────────────────────────────────
const mockPrisma = {
  user: { findUnique: jest.fn() },
  coupon: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  booking: {
    count: jest.fn(),
    updateMany: jest.fn(),
  },
};

jest.mock('../../config/database', () => ({ prisma: mockPrisma }));
jest.mock('../../utils/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

import couponRoutes from './coupon.routes';
import { errorHandler } from '../../middleware/errorHandler';

const createApp = () => {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use('/api/coupons', couponRoutes);
  app.use(errorHandler);
  return app;
};

// ─── Tokens ─────────────────────────────────────────────────────────────────
const adminToken = signAccessToken({ userId: 'admin-1', email: 'admin@test.com', role: 'ADMIN' });
const userToken = signAccessToken({ userId: 'user-1', email: 'user@test.com', role: 'USER' });

const mockCoupon = {
  id: 'coupon-1',
  code: 'SAVE20',
  description: '20% off',
  type: 'PERCENTAGE',
  value: 20,
  minOrderAmount: 100,
  maxDiscount: 200,
  usageLimit: 50,
  usedCount: 5,
  perUserLimit: 2,
  isActive: true,
  validFrom: new Date(Date.now() - 86400000),
  validUntil: new Date(Date.now() + 86400000 * 30),
  applicableGenres: [],
  createdAt: new Date(),
};

describe('Coupon Routes Integration', () => {
  let app: express.Express;

  beforeAll(() => { app = createApp(); });
  beforeEach(() => { jest.clearAllMocks(); });

  // ═══════════════════════════════════════════════════════════════════════════
  // GET /api/coupons  (public)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('GET /api/coupons (active coupons)', () => {
    it('should return active coupons without auth', async () => {
      mockPrisma.coupon.findMany.mockResolvedValue([mockCoupon]);

      const res = await request(app).get('/api/coupons');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should return empty array when no coupons available', async () => {
      mockPrisma.coupon.findMany.mockResolvedValue([]);

      const res = await request(app).get('/api/coupons');
      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // POST /api/coupons/apply  (user only)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('POST /api/coupons/apply', () => {
    it('should return 401 without auth token', async () => {
      const res = await request(app)
        .post('/api/coupons/apply')
        .send({ code: 'SAVE20', orderAmount: 500 });
      expect(res.status).toBe(401);
    });

    it('should apply valid coupon and return discount', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1', isActive: true, role: 'USER' });
      mockPrisma.coupon.findUnique.mockResolvedValue(mockCoupon);
      mockPrisma.booking.count.mockResolvedValue(0);

      const res = await request(app)
        .post('/api/coupons/apply')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ code: 'SAVE20', orderAmount: 500 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.discount).toBe(100); // 20% of 500
      expect(res.body.data.finalAmount).toBe(400);
      expect(res.body.data.code).toBe('SAVE20');
    });

    it('should return 404 for invalid coupon code', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1', isActive: true, role: 'USER' });
      mockPrisma.coupon.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/coupons/apply')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ code: 'DOESNOTEXIST', orderAmount: 500 });

      expect(res.status).toBe(404);
    });

    it('should return 400 when per-user limit is exceeded', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1', isActive: true, role: 'USER' });
      mockPrisma.coupon.findUnique.mockResolvedValue(mockCoupon);
      mockPrisma.booking.count.mockResolvedValue(2); // perUserLimit = 2

      const res = await request(app)
        .post('/api/coupons/apply')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ code: 'SAVE20', orderAmount: 500 });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('already used');
    });

    it('should return 400 when coupon code is missing', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1', isActive: true, role: 'USER' });

      const res = await request(app)
        .post('/api/coupons/apply')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ orderAmount: 500 });

      expect(res.status).toBe(400);
    });

    it('should return 400 when orderAmount is missing', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1', isActive: true, role: 'USER' });

      const res = await request(app)
        .post('/api/coupons/apply')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ code: 'SAVE20' });

      expect(res.status).toBe(400);
    });

    it('should return 400 when order amount is below minimum', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1', isActive: true, role: 'USER' });
      mockPrisma.coupon.findUnique.mockResolvedValue({ ...mockCoupon, minOrderAmount: 1000 });
      mockPrisma.booking.count.mockResolvedValue(0);

      const res = await request(app)
        .post('/api/coupons/apply')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ code: 'SAVE20', orderAmount: 500 });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Minimum order');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // ADMIN ROUTES — auth guard checks
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Admin coupon routes — auth guards', () => {
    it('should return 401 for unauthenticated admin requests', async () => {
      const res = await request(app).get('/api/coupons/admin');
      expect(res.status).toBe(401);
    });

    it('should return 403 for USER role on admin routes', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1', isActive: true, role: 'USER' });

      const res = await request(app)
        .get('/api/coupons/admin')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // ADMIN: GET /api/coupons/admin
  // ═══════════════════════════════════════════════════════════════════════════
  describe('GET /api/coupons/admin (list all)', () => {
    it('should list all coupons for admin', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'admin-1', isActive: true, role: 'ADMIN' });
      mockPrisma.coupon.findMany.mockResolvedValue([{ ...mockCoupon, _count: { bookings: 3 } }]);

      const res = await request(app)
        .get('/api/coupons/admin')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].effectivelyActive).toBeDefined();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // ADMIN: POST /api/coupons/admin (create)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('POST /api/coupons/admin (create)', () => {
    const validCouponData = {
      code: 'NEWCODE',
      type: 'PERCENTAGE',
      value: 15,
      validFrom: new Date(Date.now() - 86400000).toISOString(),
      validUntil: new Date(Date.now() + 86400000 * 30).toISOString(),
    };

    it('should create coupon successfully', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'admin-1', isActive: true, role: 'ADMIN' });
      mockPrisma.coupon.findUnique.mockResolvedValue(null); // no duplicate
      mockPrisma.coupon.create.mockResolvedValue({ id: 'new-coupon', ...validCouponData });

      const res = await request(app)
        .post('/api/coupons/admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validCouponData);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('should return 400 for missing required fields', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'admin-1', isActive: true, role: 'ADMIN' });

      const res = await request(app)
        .post('/api/coupons/admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ code: 'NOVALUE' }); // missing type, value, dates

      expect(res.status).toBe(400);
    });

    it('should return 400 for invalid type', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'admin-1', isActive: true, role: 'ADMIN' });

      const res = await request(app)
        .post('/api/coupons/admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...validCouponData, type: 'BOGUS' });

      expect(res.status).toBe(400);
    });

    it('should return 409 for duplicate coupon code', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'admin-1', isActive: true, role: 'ADMIN' });
      mockPrisma.coupon.findUnique.mockResolvedValue(mockCoupon); // exists

      const res = await request(app)
        .post('/api/coupons/admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validCouponData);

      expect(res.status).toBe(409);
    });

    it('should return 400 for percentage > 100', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'admin-1', isActive: true, role: 'ADMIN' });

      const res = await request(app)
        .post('/api/coupons/admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...validCouponData, value: 150 });

      expect(res.status).toBe(400);
    });

    it('should return 400 when validFrom >= validUntil', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'admin-1', isActive: true, role: 'ADMIN' });
      const futureDate = new Date(Date.now() + 86400000 * 60).toISOString();

      const res = await request(app)
        .post('/api/coupons/admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...validCouponData, validFrom: futureDate, validUntil: futureDate });

      expect(res.status).toBe(400);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // ADMIN: PATCH /api/coupons/admin/:id/toggle
  // ═══════════════════════════════════════════════════════════════════════════
  describe('PATCH /api/coupons/admin/:id/toggle', () => {
    it('should toggle coupon active status', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'admin-1', isActive: true, role: 'ADMIN' });
      mockPrisma.coupon.findUnique.mockResolvedValue(mockCoupon);
      mockPrisma.coupon.update.mockResolvedValue({ ...mockCoupon, isActive: false });

      const res = await request(app)
        .patch('/api/coupons/admin/coupon-1/toggle')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('deactivated');
    });

    it('should return 404 for non-existing coupon', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'admin-1', isActive: true, role: 'ADMIN' });
      mockPrisma.coupon.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .patch('/api/coupons/admin/nonexistent/toggle')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // ADMIN: DELETE /api/coupons/admin/:id
  // ═══════════════════════════════════════════════════════════════════════════
  describe('DELETE /api/coupons/admin/:id', () => {
    it('should delete coupon successfully', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'admin-1', isActive: true, role: 'ADMIN' });
      mockPrisma.coupon.findUnique.mockResolvedValue({ ...mockCoupon, usedCount: 0 });
      mockPrisma.coupon.delete.mockResolvedValue({});

      const res = await request(app)
        .delete('/api/coupons/admin/coupon-1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('deleted');
    });

    it('should detach bookings before deleting used coupon', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'admin-1', isActive: true, role: 'ADMIN' });
      mockPrisma.coupon.findUnique.mockResolvedValue(mockCoupon); // usedCount = 5
      mockPrisma.booking.updateMany.mockResolvedValue({ count: 5 });
      mockPrisma.coupon.delete.mockResolvedValue({});

      const res = await request(app)
        .delete('/api/coupons/admin/coupon-1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(mockPrisma.booking.updateMany).toHaveBeenCalled();
    });

    it('should return 404 for non-existing coupon', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'admin-1', isActive: true, role: 'ADMIN' });
      mockPrisma.coupon.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .delete('/api/coupons/admin/nonexistent')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });
});
