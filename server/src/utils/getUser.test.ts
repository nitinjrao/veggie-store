import { Request } from 'express';
import { getAuthUser } from './getUser';
import { ApiError } from './ApiError';

describe('getAuthUser', () => {
  it('returns the user when req.user is present', () => {
    const mockUser = { id: 'user-123', role: 'customer' as const, firebaseUid: 'fb-uid-123' };
    const req = { user: mockUser } as unknown as Request;

    const result = getAuthUser(req);

    expect(result).toBe(mockUser);
    expect(result.id).toBe('user-123');
    expect(result.role).toBe('customer');
    expect(result.firebaseUid).toBe('fb-uid-123');
  });

  it('returns user with admin role', () => {
    const mockUser = { id: 'admin-1', role: 'admin' as const, firebaseUid: 'fb-admin' };
    const req = { user: mockUser } as unknown as Request;

    const result = getAuthUser(req);

    expect(result).toEqual(mockUser);
  });

  it('throws ApiError with 401 when req.user is undefined', () => {
    const req = {} as Request;

    expect(() => getAuthUser(req)).toThrow(ApiError);
    expect(() => getAuthUser(req)).toThrow('Authentication required');

    try {
      getAuthUser(req);
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).statusCode).toBe(401);
      expect((error as ApiError).message).toBe('Authentication required');
    }
  });

  it('throws ApiError when req.user is explicitly set to undefined', () => {
    const req = { user: undefined } as unknown as Request;

    expect(() => getAuthUser(req)).toThrow(ApiError);
  });
});
