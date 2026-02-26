import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodIssue } from 'zod';
import { errorHandler } from './errorHandler';
import { ApiError } from '../utils/ApiError';

describe('errorHandler', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let jsonFn: ReturnType<typeof vi.fn>;
  let statusFn: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockReq = {};
    jsonFn = vi.fn();
    statusFn = vi.fn().mockReturnValue({ json: jsonFn });
    mockRes = {
      status: statusFn,
      json: jsonFn,
    } as Partial<Response>;
    mockNext = vi.fn();
  });

  it('handles ApiError with correct status and message', () => {
    const error = new ApiError(404, 'Resource not found');

    errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

    expect(statusFn).toHaveBeenCalledWith(404);
    expect(jsonFn).toHaveBeenCalledWith({ error: 'Resource not found' });
  });

  it('handles ApiError with 400 status', () => {
    const error = new ApiError(400, 'Bad request');

    errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

    expect(statusFn).toHaveBeenCalledWith(400);
    expect(jsonFn).toHaveBeenCalledWith({ error: 'Bad request' });
  });

  it('handles ApiError with 401 status', () => {
    const error = new ApiError(401, 'Unauthorized');

    errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

    expect(statusFn).toHaveBeenCalledWith(401);
    expect(jsonFn).toHaveBeenCalledWith({ error: 'Unauthorized' });
  });

  it('handles ZodError with 400 and validation details', () => {
    const zodIssues: ZodIssue[] = [
      {
        code: 'invalid_type',
        expected: 'string',
        received: 'number',
        path: ['name'],
        message: 'Expected string, received number',
      },
      {
        code: 'too_small',
        minimum: 1,
        type: 'string',
        inclusive: true,
        path: ['address', 'city'],
        message: 'City is required',
      },
    ];
    const error = new ZodError(zodIssues);

    errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

    expect(statusFn).toHaveBeenCalledWith(400);
    expect(jsonFn).toHaveBeenCalledWith({
      error: 'Validation error',
      details: [
        { field: 'name', message: 'Expected string, received number' },
        { field: 'address.city', message: 'City is required' },
      ],
    });
  });

  it('handles ZodError with empty path', () => {
    const zodIssues: ZodIssue[] = [
      {
        code: 'invalid_type',
        expected: 'object',
        received: 'undefined',
        path: [],
        message: 'Required',
      },
    ];
    const error = new ZodError(zodIssues);

    errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

    expect(statusFn).toHaveBeenCalledWith(400);
    expect(jsonFn).toHaveBeenCalledWith({
      error: 'Validation error',
      details: [{ field: '', message: 'Required' }],
    });
  });

  it('handles generic Error with 500 status', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const error = new Error('Unexpected failure');

    errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

    expect(statusFn).toHaveBeenCalledWith(500);
    expect(jsonFn).toHaveBeenCalledWith({ error: 'Internal server error' });
    expect(consoleSpy).toHaveBeenCalledWith('Unhandled error:', error);

    consoleSpy.mockRestore();
  });

  it('logs the unhandled error to console.error', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const error = new Error('DB connection failed');

    errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

    expect(consoleSpy).toHaveBeenCalledTimes(1);
    expect(consoleSpy).toHaveBeenCalledWith('Unhandled error:', error);

    consoleSpy.mockRestore();
  });
});
