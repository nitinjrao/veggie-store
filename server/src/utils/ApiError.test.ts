import { ApiError } from './ApiError';

describe('ApiError', () => {
  it('creates with correct statusCode and message', () => {
    const error = new ApiError(404, 'Not found');
    expect(error.statusCode).toBe(404);
    expect(error.message).toBe('Not found');
  });

  it('is an instance of Error', () => {
    const error = new ApiError(400, 'Bad request');
    expect(error).toBeInstanceOf(Error);
  });

  it('has name set to ApiError', () => {
    const error = new ApiError(500, 'Server error');
    expect(error.name).toBe('ApiError');
  });

  it('works with 400 Bad Request', () => {
    const error = new ApiError(400, 'Bad request');
    expect(error.statusCode).toBe(400);
    expect(error.message).toBe('Bad request');
  });

  it('works with 401 Unauthorized', () => {
    const error = new ApiError(401, 'Unauthorized');
    expect(error.statusCode).toBe(401);
    expect(error.message).toBe('Unauthorized');
  });

  it('works with 403 Forbidden', () => {
    const error = new ApiError(403, 'Forbidden');
    expect(error.statusCode).toBe(403);
    expect(error.message).toBe('Forbidden');
  });

  it('works with 404 Not Found', () => {
    const error = new ApiError(404, 'Not found');
    expect(error.statusCode).toBe(404);
    expect(error.message).toBe('Not found');
  });

  it('works with 500 Internal Server Error', () => {
    const error = new ApiError(500, 'Internal server error');
    expect(error.statusCode).toBe(500);
    expect(error.message).toBe('Internal server error');
  });

  it('is catchable as an Error', () => {
    expect(() => {
      throw new ApiError(422, 'Unprocessable');
    }).toThrow(Error);
  });

  it('preserves the message in the Error stack', () => {
    const error = new ApiError(400, 'Test error message');
    expect(error.stack).toContain('Test error message');
  });
});
