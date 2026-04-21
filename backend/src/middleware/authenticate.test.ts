import { Response, NextFunction } from 'express';
import { authenticate, requireRole, optionalAuth, AuthRequest } from './authenticate';
import { signAccessToken } from '../utils/jwt';

// Mock Prisma
jest.mock('../config/database', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

const { prisma } = require('../config/database');

// Helper
const createMockReqRes = (authHeader?: string) => {
  const req: any = {
    headers: authHeader ? { authorization: authHeader } : {},
    user: undefined,
  };
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  const next: NextFunction = jest.fn();
  return { req: req as AuthRequest, res: res as Response, next };
};

describe('authenticate middleware', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return 401 when no auth header is provided', async () => {
    const { req, res, next } = createMockReqRes();
    await authenticate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Access token required' }),
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 when auth header does not start with Bearer', async () => {
    const { req, res, next } = createMockReqRes('Basic abc123');
    await authenticate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 for invalid/malformed token', async () => {
    const { req, res, next } = createMockReqRes('Bearer invalid-token-here');
    await authenticate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Invalid or expired access token' }),
    );
  });

  it('should return 401 when user does not exist in DB', async () => {
    const token = signAccessToken({ userId: 'user-404', email: 'ghost@x.com', role: 'USER' });
    prisma.user.findUnique.mockResolvedValue(null);
    const { req, res, next } = createMockReqRes(`Bearer ${token}`);
    await authenticate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'User not found or deactivated' }),
    );
  });

  it('should return 401 when user is deactivated', async () => {
    const token = signAccessToken({ userId: 'user-inactive', email: 'off@x.com', role: 'USER' });
    prisma.user.findUnique.mockResolvedValue({ id: 'user-inactive', isActive: false, role: 'USER' });
    const { req, res, next } = createMockReqRes(`Bearer ${token}`);
    await authenticate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('should call next() and set req.user for valid token + active user', async () => {
    const payload = { userId: 'user-ok', email: 'ok@x.com', role: 'USER' };
    const token = signAccessToken(payload);
    prisma.user.findUnique.mockResolvedValue({ id: 'user-ok', isActive: true, role: 'USER' });
    const { req, res, next } = createMockReqRes(`Bearer ${token}`);
    await authenticate(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.user).toBeDefined();
    expect(req.user!.userId).toBe('user-ok');
    expect(req.user!.email).toBe('ok@x.com');
    expect(req.user!.role).toBe('USER');
    expect(req.user!.id).toBe('user-ok');
  });
});

describe('requireRole middleware', () => {
  it('should return 401 if req.user is not set', () => {
    const middleware = requireRole('ADMIN');
    const { req, res, next } = createMockReqRes();
    middleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 403 if user role does not match', () => {
    const middleware = requireRole('ADMIN', 'SUPER_ADMIN');
    const { req, res, next } = createMockReqRes();
    req.user = { userId: '1', email: 'a@b.com', role: 'USER', id: '1' };
    middleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Insufficient permissions' }),
    );
  });

  it('should call next() if user has matching role', () => {
    const middleware = requireRole('ADMIN', 'SUPER_ADMIN');
    const { req, res, next } = createMockReqRes();
    req.user = { userId: '1', email: 'admin@x.com', role: 'ADMIN', id: '1' };
    middleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('should accept SUPER_ADMIN when listed', () => {
    const middleware = requireRole('ADMIN', 'SUPER_ADMIN');
    const { req, res, next } = createMockReqRes();
    req.user = { userId: '1', email: 'sa@x.com', role: 'SUPER_ADMIN', id: '1' };
    middleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});

describe('optionalAuth middleware', () => {
  it('should set req.user when valid Bearer token is provided', async () => {
    const payload = { userId: 'user-opt', email: 'opt@x.com', role: 'USER' };
    const token = signAccessToken(payload);
    const { req, res, next } = createMockReqRes(`Bearer ${token}`);
    await optionalAuth(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.user).toBeDefined();
    expect(req.user!.userId).toBe('user-opt');
  });

  it('should call next() without setting user when no token', async () => {
    const { req, res, next } = createMockReqRes();
    await optionalAuth(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.user).toBeUndefined();
  });

  it('should call next() without setting user when token is invalid', async () => {
    const { req, res, next } = createMockReqRes('Bearer bad-token');
    await optionalAuth(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.user).toBeUndefined();
  });
});
