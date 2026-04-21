import { Request, Response, NextFunction } from 'express';
import { AppError, errorHandler } from './errorHandler';

// Silence logger during tests
jest.mock('../utils/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

const createMockReqRes = () => {
  const req = { method: 'POST', path: '/api/test' } as Request;
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  const next: NextFunction = jest.fn();
  return { req, res: res as Response, next };
};

describe('AppError class', () => {
  it('should create an error with message and status code', () => {
    const err = new AppError('Not found', 404);
    expect(err.message).toBe('Not found');
    expect(err.statusCode).toBe(404);
    expect(err.name).toBe('AppError');
    expect(err instanceof Error).toBe(true);
  });

  it('should default to status 400', () => {
    const err = new AppError('Bad request');
    expect(err.statusCode).toBe(400);
  });

  it('should accept optional errors field', () => {
    const details = [{ field: 'email', msg: 'invalid' }];
    const err = new AppError('Validation error', 422, details);
    expect(err.errors).toEqual(details);
  });
});

describe('errorHandler middleware', () => {
  it('should handle AppError with correct status and body', () => {
    const { req, res, next } = createMockReqRes();
    const err = new AppError('Email already exists', 409);
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Email already exists',
      errors: undefined,
    });
  });

  it('should handle AppError with errors array', () => {
    const { req, res, next } = createMockReqRes();
    const details = [{ field: 'name' }];
    const err = new AppError('Validation', 422, details);
    errorHandler(err, req, res, next);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Validation',
      errors: details,
    });
  });

  it('should handle Prisma P2002 (unique constraint)', () => {
    const { req, res, next } = createMockReqRes();
    const err: any = new Error('Prisma unique constraint');
    err.code = 'P2002';
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'A record with this value already exists.' }),
    );
  });

  it('should handle Prisma P2025 (not found)', () => {
    const { req, res, next } = createMockReqRes();
    const err: any = new Error('Prisma not found');
    err.code = 'P2025';
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Record not found.' }),
    );
  });

  it('should handle JsonWebTokenError', () => {
    const { req, res, next } = createMockReqRes();
    const err = new Error('jwt malformed');
    err.name = 'JsonWebTokenError';
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Invalid token.' }),
    );
  });

  it('should handle TokenExpiredError', () => {
    const { req, res, next } = createMockReqRes();
    const err = new Error('jwt expired');
    err.name = 'TokenExpiredError';
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Token expired.' }),
    );
  });

  it('should return 500 for unknown errors', () => {
    const { req, res, next } = createMockReqRes();
    const err = new Error('Something unexpected');
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('should hide error details in production', () => {
    const origEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    const { req, res, next } = createMockReqRes();
    const err = new Error('Secret internal details');
    errorHandler(err, req, res, next);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Internal server error',
    });
    process.env.NODE_ENV = origEnv;
  });
});
