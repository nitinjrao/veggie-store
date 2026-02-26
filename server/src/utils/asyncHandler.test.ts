import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from './asyncHandler';

describe('asyncHandler', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {};
    mockRes = {};
    mockNext = vi.fn();
  });

  it('calls the wrapped function with req, res, and next', async () => {
    const fn = vi.fn().mockResolvedValue(undefined);
    const handler = asyncHandler(fn);

    await handler(mockReq as Request, mockRes as Response, mockNext);

    expect(fn).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('calls next with the error when the wrapped function rejects', async () => {
    const error = new Error('Something went wrong');
    const fn = vi.fn().mockRejectedValue(error);
    const handler = asyncHandler(fn);

    await handler(mockReq as Request, mockRes as Response, mockNext);

    // Allow the microtask (Promise.catch) to settle
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(mockNext).toHaveBeenCalledWith(error);
  });

  it('calls next with the error when an async function throws inside its body', async () => {
    const error = new Error('Async body throw');
    const fn = vi.fn().mockImplementation(async () => {
      throw error;
    });
    const handler = asyncHandler(fn);

    await handler(mockReq as Request, mockRes as Response, mockNext);

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(mockNext).toHaveBeenCalledWith(error);
  });

  it('does not call next when the function succeeds', async () => {
    const fn = vi.fn().mockResolvedValue(undefined);
    const handler = asyncHandler(fn);

    await handler(mockReq as Request, mockRes as Response, mockNext);

    // Allow microtasks to settle
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(mockNext).not.toHaveBeenCalled();
  });

  it('returns a function', () => {
    const fn = vi.fn().mockResolvedValue(undefined);
    const handler = asyncHandler(fn);
    expect(typeof handler).toBe('function');
  });
});
