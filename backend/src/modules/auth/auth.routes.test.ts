import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import { signAccessToken, signRefreshToken } from '../../utils/jwt';

// ─── Mock Prisma ────────────────────────────────────────────────────────────
const mockPrisma = {
  user: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  otp: {
    create: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  refreshToken: {
    create: jest.fn(),
    findUnique: jest.fn(),
    deleteMany: jest.fn(),
  },
  $transaction: jest.fn((fns: any[]) => Promise.all(fns)),
};

jest.mock('../../config/database', () => ({ prisma: mockPrisma }));

// ─── Mock auth service (email sending) ──────────────────────────────────────
jest.mock('./auth.service', () => ({
  sendOtpEmail: jest.fn().mockResolvedValue(undefined),
  sendWelcomeEmail: jest.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
}));

// ─── Mock logger ────────────────────────────────────────────────────────────
jest.mock('../../utils/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

// ─── Build test app ─────────────────────────────────────────────────────────
import authRoutes from './auth.routes';
import { errorHandler } from '../../middleware/errorHandler';

const createApp = () => {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use('/api/auth', authRoutes);
  app.use(errorHandler);
  return app;
};

// ─── Helpers ────────────────────────────────────────────────────────────────
const validUser = {
  name: 'John Doe',
  email: 'john@example.com',
  phone: '9876543210',
  password: 'Str0ng@Pass!',
};

const mockDbUser = {
  id: 'user-001',
  name: 'John Doe',
  email: 'john@example.com',
  phone: '9876543210',
  role: 'USER',
  passwordHash: '', // Will be set in tests
  isActive: true,
  isVerified: true,
  createdAt: new Date(),
};

describe('Auth Routes Integration', () => {
  let app: express.Express;

  beforeAll(() => {
    app = createApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // POST /api/auth/register
  // ═══════════════════════════════════════════════════════════════════════════
  describe('POST /api/auth/register', () => {
    it('should register a new user successfully (201)', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null); // no existing user
      mockPrisma.user.create.mockResolvedValue({
        id: 'new-user', name: 'John Doe', email: 'john@example.com',
        phone: '9876543210', role: 'USER', createdAt: new Date(),
      });
      mockPrisma.otp.create.mockResolvedValue({});

      const res = await request(app)
        .post('/api/auth/register')
        .send(validUser);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(validUser.email);
      expect(res.body.message).toContain('Registration successful');
    });

    it('should return 409 for duplicate email/phone', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(mockDbUser);

      const res = await request(app)
        .post('/api/auth/register')
        .send(validUser);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('already registered');
    });

    it('should return 422 for missing name', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...validUser, name: '' });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });

    it('should return 422 for invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...validUser, email: 'not-an-email' });

      expect(res.status).toBe(422);
    });

    it('should return 422 for invalid phone (not 10 digits)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...validUser, phone: '12345' });

      expect(res.status).toBe(422);
    });

    it('should return 422 for weak password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...validUser, password: '123' });

      expect(res.status).toBe(422);
    });

    it('should return 422 for password without special char', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...validUser, password: 'NoSpecial1A' });

      expect(res.status).toBe(422);
    });

    it('should return 422 for missing all fields', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({});

      expect(res.status).toBe(422);
      expect(res.body.errors.length).toBeGreaterThanOrEqual(3);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // POST /api/auth/login
  // ═══════════════════════════════════════════════════════════════════════════
  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      // Hash the password first
      const bcrypt = require('bcryptjs');
      const hash = await bcrypt.hash(validUser.password, 4);

      mockPrisma.user.findUnique.mockResolvedValue({ ...mockDbUser, passwordHash: hash });
      mockPrisma.refreshToken.create.mockResolvedValue({});

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: validUser.email, password: validUser.password });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.user.email).toBe(validUser.email);
      // Should NOT expose passwordHash
      expect(res.body.data.user.passwordHash).toBeUndefined();
      // Refresh token should be set as httpOnly cookie
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('should return 401 for wrong password', async () => {
      const bcrypt = require('bcryptjs');
      const hash = await bcrypt.hash('RealPassword1!', 4);
      mockPrisma.user.findUnique.mockResolvedValue({ ...mockDbUser, passwordHash: hash });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: validUser.email, password: 'WrongPassword1!' });

      expect(res.status).toBe(401);
      expect(res.body.message).toContain('Invalid email or password');
    });

    it('should return 401 for non-existing user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'ghost@example.com', password: 'Pass1234!' });

      expect(res.status).toBe(401);
    });

    it('should return 403 for deactivated user', async () => {
      const bcrypt = require('bcryptjs');
      const hash = await bcrypt.hash(validUser.password, 4);
      mockPrisma.user.findUnique.mockResolvedValue({
        ...mockDbUser, passwordHash: hash, isActive: false,
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: validUser.email, password: validUser.password });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('deactivated');
    });

    it('should return 422 for missing email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ password: 'Test1234!' });

      expect(res.status).toBe(422);
    });

    it('should return 422 for missing password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com' });

      expect(res.status).toBe(422);
    });

    it('should return 422 for invalid email format', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'bad-email', password: 'Test1234!' });

      expect(res.status).toBe(422);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // POST /api/auth/logout
  // ═══════════════════════════════════════════════════════════════════════════
  describe('POST /api/auth/logout', () => {
    it('should logout successfully and clear cookie', async () => {
      mockPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 1 });

      const res = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', ['refreshToken=test-token']);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('Logged out');
    });

    it('should succeed even without refreshToken cookie', async () => {
      const res = await request(app).post('/api/auth/logout');
      expect(res.status).toBe(200);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // POST /api/auth/refresh
  // ═══════════════════════════════════════════════════════════════════════════
  describe('POST /api/auth/refresh', () => {
    it('should return new access token for valid refresh token', async () => {
      const payload = { userId: 'user-001', email: 'john@example.com', role: 'USER' };
      const refreshToken = signRefreshToken(payload);
      mockPrisma.refreshToken.findUnique.mockResolvedValue({
        token: refreshToken,
        expiresAt: new Date(Date.now() + 86400000),
      });

      const res = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', [`refreshToken=${refreshToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBeDefined();
    });

    it('should return 401 when no refresh token is provided', async () => {
      const res = await request(app).post('/api/auth/refresh');
      expect(res.status).toBe(401);
    });

    it('should return 401 for expired stored refresh token', async () => {
      const payload = { userId: 'user-001', email: 'john@example.com', role: 'USER' };
      const refreshToken = signRefreshToken(payload);
      mockPrisma.refreshToken.findUnique.mockResolvedValue({
        token: refreshToken,
        expiresAt: new Date(Date.now() - 86400000), // expired yesterday
      });

      const res = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', [`refreshToken=${refreshToken}`]);

      expect(res.status).toBe(401);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // POST /api/auth/send-otp
  // ═══════════════════════════════════════════════════════════════════════════
  describe('POST /api/auth/send-otp', () => {
    it('should send OTP to existing user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockDbUser);
      mockPrisma.otp.updateMany.mockResolvedValue({ count: 0 });
      mockPrisma.otp.create.mockResolvedValue({});

      const res = await request(app)
        .post('/api/auth/send-otp')
        .send({ email: 'john@example.com', purpose: 'EMAIL_VERIFY' });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('OTP sent');
    });

    it('should return 404 for non-existing user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/auth/send-otp')
        .send({ email: 'nobody@example.com', purpose: 'EMAIL_VERIFY' });

      expect(res.status).toBe(404);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // POST /api/auth/verify-otp
  // ═══════════════════════════════════════════════════════════════════════════
  describe('POST /api/auth/verify-otp', () => {
    it('should verify valid OTP', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockDbUser);
      mockPrisma.otp.findFirst.mockResolvedValue({ id: 'otp-1', code: '123456' });
      mockPrisma.otp.update.mockResolvedValue({});
      mockPrisma.user.update.mockResolvedValue({});

      const res = await request(app)
        .post('/api/auth/verify-otp')
        .send({ email: 'john@example.com', code: '123456', purpose: 'EMAIL_VERIFY' });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('OTP verified');
    });

    it('should return 400 for invalid/expired OTP', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockDbUser);
      mockPrisma.otp.findFirst.mockResolvedValue(null); // no valid OTP found

      const res = await request(app)
        .post('/api/auth/verify-otp')
        .send({ email: 'john@example.com', code: '000000', purpose: 'EMAIL_VERIFY' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Invalid or expired OTP');
    });

    it('should return 404 for non-existing user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/auth/verify-otp')
        .send({ email: 'ghost@x.com', code: '123456', purpose: 'EMAIL_VERIFY' });

      expect(res.status).toBe(404);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // POST /api/auth/forgot-password
  // ═══════════════════════════════════════════════════════════════════════════
  describe('POST /api/auth/forgot-password', () => {
    it('should send reset OTP for existing user (200)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockDbUser);
      mockPrisma.otp.create.mockResolvedValue({});

      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'john@example.com' });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('reset OTP');
    });

    it('should still return 200 for non-existing user (no reveal)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'unknown@example.com' });

      // Security: don't reveal if user exists
      expect(res.status).toBe(200);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // POST /api/auth/reset-password
  // ═══════════════════════════════════════════════════════════════════════════
  describe('POST /api/auth/reset-password', () => {
    it('should reset password with valid OTP', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockDbUser);
      mockPrisma.otp.findFirst.mockResolvedValue({ id: 'otp-reset', code: '654321' });
      mockPrisma.$transaction.mockResolvedValue([{}, {}, {}]);

      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({ email: 'john@example.com', code: '654321', newPassword: 'NewStr0ng@Pass' });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('Password reset');
    });

    it('should return 400 for invalid OTP', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockDbUser);
      mockPrisma.otp.findFirst.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({ email: 'john@example.com', code: '000000', newPassword: 'NewPass1!' });

      expect(res.status).toBe(400);
    });

    it('should return 404 for non-existing user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({ email: 'ghost@x.com', code: '123456', newPassword: 'Pass123!' });

      expect(res.status).toBe(404);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // GET /api/auth/me  (protected)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('GET /api/auth/me', () => {
    it('should return 401 without access token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });

    it('should return 401 with invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(res.status).toBe(401);
    });

    it('should return user profile with valid token', async () => {
      const token = signAccessToken({ userId: 'user-001', email: 'john@example.com', role: 'USER' });
      // authenticate middleware lookup
      mockPrisma.user.findUnique
        .mockResolvedValueOnce({ id: 'user-001', isActive: true, role: 'USER' }) // authenticate
        .mockResolvedValueOnce({ // getMe
          id: 'user-001', name: 'John Doe', email: 'john@example.com',
          phone: '9876543210', role: 'USER', isVerified: true, avatarUrl: null,
          city: null, createdAt: new Date(),
        });

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe('john@example.com');
      expect(res.body.data.name).toBe('John Doe');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PATCH /api/auth/me  (protected)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('PATCH /api/auth/me', () => {
    it('should return 401 without access token', async () => {
      const res = await request(app)
        .patch('/api/auth/me')
        .send({ name: 'New Name' });
      expect(res.status).toBe(401);
    });

    it('should update user profile with valid token', async () => {
      const token = signAccessToken({ userId: 'user-001', email: 'john@example.com', role: 'USER' });
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-001', isActive: true, role: 'USER' });
      mockPrisma.user.update.mockResolvedValue({
        id: 'user-001', name: 'Updated Name', email: 'john@example.com',
        phone: '9876543210', role: 'USER', city: 'Mumbai', avatarUrl: null,
      });

      const res = await request(app)
        .patch('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Updated Name', city: 'Mumbai' });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Updated Name');
      expect(res.body.data.city).toBe('Mumbai');
    });
  });
});
