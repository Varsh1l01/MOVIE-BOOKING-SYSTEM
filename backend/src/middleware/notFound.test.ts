import { notFound } from './notFound';
import { Request, Response } from 'express';

const createMockReqRes = (method = 'GET', path = '/unknown') => {
  const req = { method, path } as Request;
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return { req, res: res as Response };
};

describe('notFound middleware', () => {
  it('should return 404 with route info', () => {
    const { req, res } = createMockReqRes('GET', '/api/nonexistent');
    notFound(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Route GET /api/nonexistent not found',
    });
  });

  it('should include POST method in message', () => {
    const { req, res } = createMockReqRes('POST', '/api/missing');
    notFound(req, res);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Route POST /api/missing not found',
      }),
    );
  });
});
