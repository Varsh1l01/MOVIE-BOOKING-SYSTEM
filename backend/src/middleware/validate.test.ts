import { Request, Response, NextFunction } from 'express';
import { validate } from './validate';

// We need to simulate express-validator's validationResult
// The validate middleware reads the validation result from the request
jest.mock('express-validator', () => {
  let mockErrors: any[] = [];
  return {
    validationResult: jest.fn(() => ({
      isEmpty: () => mockErrors.length === 0,
      array: () => mockErrors,
    })),
    __setMockErrors: (errors: any[]) => { mockErrors = errors; },
  };
});

const createMockReqRes = () => {
  const req = {} as Request;
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  const next: NextFunction = jest.fn();
  return { req, res: res as Response, next };
};

describe('validate middleware', () => {
  const { __setMockErrors } = require('express-validator');

  afterEach(() => {
    __setMockErrors([]);
  });

  it('should call next() when there are no validation errors', () => {
    __setMockErrors([]);
    const { req, res, next } = createMockReqRes();
    validate(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should return 422 with errors when validation fails', () => {
    const errors = [
      { type: 'field', msg: 'Valid email required', path: 'email', location: 'body' },
    ];
    __setMockErrors(errors);
    const { req, res, next } = createMockReqRes();
    validate(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Validation failed',
      errors,
    });
  });

  it('should include all field errors in the response', () => {
    const errors = [
      { msg: 'Name required', path: 'name' },
      { msg: 'Email required', path: 'email' },
      { msg: 'Password too short', path: 'password' },
    ];
    __setMockErrors(errors);
    const { req, res, next } = createMockReqRes();
    validate(req, res, next);
    const body = (res.json as jest.Mock).mock.calls[0][0];
    expect(body.errors).toHaveLength(3);
  });
});
