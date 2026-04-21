import { Response } from 'express';
import { sendSuccess, sendError, sendPaginated } from './response';

// Helper to create a mock Express Response
const createMockRes = (): Response => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
};

describe('response utilities', () => {
  describe('sendSuccess', () => {
    it('should send 200 with success: true by default', () => {
      const res = createMockRes();
      sendSuccess(res, { id: 1 });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Success',
        data: { id: 1 },
      });
    });

    it('should use custom message and status code', () => {
      const res = createMockRes();
      sendSuccess(res, null, 'Created', 201);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Created',
        data: null,
      });
    });

    it('should handle array data', () => {
      const res = createMockRes();
      sendSuccess(res, [1, 2, 3], 'List');
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ data: [1, 2, 3] }),
      );
    });
  });

  describe('sendError', () => {
    it('should send 400 with success: false by default', () => {
      const res = createMockRes();
      sendError(res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'An error occurred',
        errors: undefined,
      });
    });

    it('should use custom message, status code, and error details', () => {
      const res = createMockRes();
      const errors = [{ field: 'email', msg: 'Invalid' }];
      sendError(res, 'Validation failed', 422, errors);
      expect(res.status).toHaveBeenCalledWith(422);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        errors,
      });
    });

    it('should send 401 for unauthorized', () => {
      const res = createMockRes();
      sendError(res, 'Unauthorized', 401);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should send 500 for server error', () => {
      const res = createMockRes();
      sendError(res, 'Internal error', 500);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('sendPaginated', () => {
    it('should include correct pagination metadata', () => {
      const res = createMockRes();
      sendPaginated(res, [1, 2, 3], 25, 1, 10, 'List fetched');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'List fetched',
        data: [1, 2, 3],
        pagination: {
          total: 25,
          page: 1,
          limit: 10,
          totalPages: 3,
          hasNext: true,
          hasPrev: false,
        },
      });
    });

    it('should calculate hasNext = false on last page', () => {
      const res = createMockRes();
      sendPaginated(res, [], 20, 2, 10);
      const body = (res.json as jest.Mock).mock.calls[0][0];
      expect(body.pagination.hasNext).toBe(false);
      expect(body.pagination.hasPrev).toBe(true);
      expect(body.pagination.totalPages).toBe(2);
    });

    it('should handle single page (total < limit)', () => {
      const res = createMockRes();
      sendPaginated(res, [1], 1, 1, 10);
      const body = (res.json as jest.Mock).mock.calls[0][0];
      expect(body.pagination.totalPages).toBe(1);
      expect(body.pagination.hasNext).toBe(false);
      expect(body.pagination.hasPrev).toBe(false);
    });

    it('should handle empty results', () => {
      const res = createMockRes();
      sendPaginated(res, [], 0, 1, 10);
      const body = (res.json as jest.Mock).mock.calls[0][0];
      expect(body.pagination.totalPages).toBe(0);
      expect(body.pagination.hasNext).toBe(false);
    });
  });
});
