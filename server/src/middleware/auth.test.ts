import { Request, Response } from 'express';
import { ApiError } from '../utils/ApiError';

// Mock firebase and prisma before importing auth
vi.mock('../lib/firebase', () => ({
  firebaseAuth: {
    verifyIdToken: vi.fn(),
  },
}));

vi.mock('../lib/prisma', () => ({
  prisma: {
    adminUser: { findFirst: vi.fn(), findUnique: vi.fn() },
    customer: { findFirst: vi.fn(), findUnique: vi.fn() },
    staffUser: { findFirst: vi.fn(), findUnique: vi.fn() },
  },
}));

import { authenticate, requireRole, requireAdmin, requireCustomer } from './auth';
import { firebaseAuth } from '../lib/firebase';
import { prisma } from '../lib/prisma';

function createMockReq(overrides: Partial<Request> = {}): Request {
  return {
    headers: {},
    originalUrl: '/api/test',
    url: '/api/test',
    ...overrides,
  } as unknown as Request;
}

function createMockRes(): Response {
  return {} as Response;
}

describe('authenticate middleware', () => {
  let mockNext: ReturnType<typeof vi.fn>;
  const mockVerifyIdToken = (firebaseAuth as unknown as { verifyIdToken: ReturnType<typeof vi.fn> })
    .verifyIdToken;
  const originalEnv = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON = 'some-json';
  });

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    } else {
      process.env.FIREBASE_SERVICE_ACCOUNT_JSON = originalEnv;
    }
  });

  it('calls next with ApiError 401 when no authorization header is present', async () => {
    mockNext = vi.fn();
    const req = createMockReq();

    await authenticate(req, createMockRes(), mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
    const error = mockNext.mock.calls[0][0] as ApiError;
    expect(error.statusCode).toBe(401);
    expect(error.message).toBe('No token provided');
  });

  it('calls next with ApiError 401 when authorization header does not start with Bearer', async () => {
    mockNext = vi.fn();
    const req = createMockReq({ headers: { authorization: 'Basic abc123' } } as Partial<Request>);

    await authenticate(req, createMockRes(), mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
    const error = mockNext.mock.calls[0][0] as ApiError;
    expect(error.statusCode).toBe(401);
    expect(error.message).toBe('No token provided');
  });

  it('verifies token and finds customer user', async () => {
    mockNext = vi.fn();
    mockVerifyIdToken.mockResolvedValue({ uid: 'fb-uid-customer' });
    (prisma.customer.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'cust-1',
      firebaseUid: 'fb-uid-customer',
    });

    const req = createMockReq({
      headers: { authorization: 'Bearer valid-token' },
    } as Partial<Request>);

    await authenticate(req, createMockRes(), mockNext);

    expect(mockVerifyIdToken).toHaveBeenCalledWith('valid-token');
    expect(req.user).toEqual({
      id: 'cust-1',
      role: 'customer',
      firebaseUid: 'fb-uid-customer',
    });
    expect(mockNext).toHaveBeenCalledWith();
  });

  it('verifies token and finds admin user when customer not found', async () => {
    mockNext = vi.fn();
    mockVerifyIdToken.mockResolvedValue({ uid: 'fb-uid-admin' });
    (prisma.customer.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (prisma.adminUser.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'admin-1',
      firebaseUid: 'fb-uid-admin',
    });

    const req = createMockReq({
      headers: { authorization: 'Bearer admin-token' },
    } as Partial<Request>);

    await authenticate(req, createMockRes(), mockNext);

    expect(req.user).toEqual({
      id: 'admin-1',
      role: 'admin',
      firebaseUid: 'fb-uid-admin',
    });
    expect(mockNext).toHaveBeenCalledWith();
  });

  it('verifies token and finds active staff user', async () => {
    mockNext = vi.fn();
    mockVerifyIdToken.mockResolvedValue({ uid: 'fb-uid-producer' });
    (prisma.customer.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (prisma.adminUser.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (prisma.staffUser.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'staff-1',
      firebaseUid: 'fb-uid-producer',
      role: 'PRODUCER',
      active: true,
    });

    const req = createMockReq({
      headers: { authorization: 'Bearer staff-token' },
    } as Partial<Request>);

    await authenticate(req, createMockRes(), mockNext);

    expect(req.user).toEqual({
      id: 'staff-1',
      role: 'producer',
      firebaseUid: 'fb-uid-producer',
    });
    expect(mockNext).toHaveBeenCalledWith();
  });

  it('returns 401 when staff user is inactive', async () => {
    mockNext = vi.fn();
    mockVerifyIdToken.mockResolvedValue({ uid: 'fb-uid-inactive' });
    (prisma.customer.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (prisma.adminUser.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (prisma.staffUser.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'staff-2',
      firebaseUid: 'fb-uid-inactive',
      role: 'SUPPLIER',
      active: false,
    });

    const req = createMockReq({
      headers: { authorization: 'Bearer inactive-token' },
    } as Partial<Request>);

    await authenticate(req, createMockRes(), mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
    const error = mockNext.mock.calls[0][0] as ApiError;
    expect(error.statusCode).toBe(401);
    expect(error.message).toBe('User not found');
  });

  it('returns 401 when no user found in any table', async () => {
    mockNext = vi.fn();
    mockVerifyIdToken.mockResolvedValue({ uid: 'fb-uid-unknown' });
    (prisma.customer.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (prisma.adminUser.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (prisma.staffUser.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const req = createMockReq({
      headers: { authorization: 'Bearer unknown-token' },
    } as Partial<Request>);

    await authenticate(req, createMockRes(), mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
    const error = mockNext.mock.calls[0][0] as ApiError;
    expect(error.statusCode).toBe(401);
    expect(error.message).toBe('User not found');
  });

  it('returns 401 when verifyIdToken throws', async () => {
    mockNext = vi.fn();
    mockVerifyIdToken.mockRejectedValue(new Error('Token expired'));

    const req = createMockReq({
      headers: { authorization: 'Bearer expired-token' },
    } as Partial<Request>);

    await authenticate(req, createMockRes(), mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
    const error = mockNext.mock.calls[0][0] as ApiError;
    expect(error.statusCode).toBe(401);
    expect(error.message).toBe('Invalid or expired token');
  });

  it('passes through ApiError from verifyIdToken catch block', async () => {
    mockNext = vi.fn();
    const apiError = new ApiError(401, 'Firebase auth not configured');
    mockVerifyIdToken.mockRejectedValue(apiError);

    const req = createMockReq({
      headers: { authorization: 'Bearer some-token' },
    } as Partial<Request>);

    await authenticate(req, createMockRes(), mockNext);

    expect(mockNext).toHaveBeenCalledWith(apiError);
  });

  it('uses cached user on second call within TTL', async () => {
    mockNext = vi.fn();
    mockVerifyIdToken.mockResolvedValue({ uid: 'fb-uid-cached' });
    (prisma.customer.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'cust-cached',
      firebaseUid: 'fb-uid-cached',
    });

    const req1 = createMockReq({
      headers: { authorization: 'Bearer cache-token' },
    } as Partial<Request>);

    await authenticate(req1, createMockRes(), mockNext);
    expect(prisma.customer.findUnique).toHaveBeenCalledTimes(1);

    // Second call should use cache
    const req2 = createMockReq({
      headers: { authorization: 'Bearer cache-token' },
    } as Partial<Request>);
    mockNext = vi.fn();

    await authenticate(req2, createMockRes(), mockNext);

    // findUnique should not be called again (cache hit)
    expect(prisma.customer.findUnique).toHaveBeenCalledTimes(1);
    expect(req2.user).toEqual({
      id: 'cust-cached',
      role: 'customer',
      firebaseUid: 'fb-uid-cached',
    });
    expect(mockNext).toHaveBeenCalledWith();
  });
});

describe('authenticate dev bypass (no FIREBASE_SERVICE_ACCOUNT_JSON)', () => {
  let mockNext: ReturnType<typeof vi.fn>;
  const originalEnv = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    mockNext = vi.fn();
  });

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    } else {
      process.env.FIREBASE_SERVICE_ACCOUNT_JSON = originalEnv;
    }
  });

  it('auto-authenticates as admin for /api/admin routes', async () => {
    (prisma.adminUser.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'admin-dev',
    });

    const req = createMockReq({ originalUrl: '/api/admin/dashboard' } as Partial<Request>);

    await authenticate(req, createMockRes(), mockNext);

    expect(req.user).toEqual({
      id: 'admin-dev',
      role: 'admin',
      firebaseUid: 'dev-bypass',
    });
    expect(mockNext).toHaveBeenCalledWith();
  });

  it('auto-authenticates as admin for /api/staff routes', async () => {
    (prisma.adminUser.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'admin-staff-dev',
    });

    const req = createMockReq({ originalUrl: '/api/staff/orders' } as Partial<Request>);

    await authenticate(req, createMockRes(), mockNext);

    expect(req.user).toEqual({
      id: 'admin-staff-dev',
      role: 'admin',
      firebaseUid: 'dev-bypass',
    });
    expect(mockNext).toHaveBeenCalledWith();
  });

  it('auto-authenticates as producer for /api/producer routes', async () => {
    (prisma.staffUser.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'producer-dev',
      role: 'PRODUCER',
      active: true,
    });

    const req = createMockReq({ originalUrl: '/api/producer/orders' } as Partial<Request>);

    await authenticate(req, createMockRes(), mockNext);

    expect(req.user).toEqual({
      id: 'producer-dev',
      role: 'producer',
      firebaseUid: 'dev-bypass',
    });
    expect(mockNext).toHaveBeenCalledWith();
  });

  it('auto-authenticates as supplier for /api/supplier routes', async () => {
    (prisma.staffUser.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'supplier-dev',
      role: 'SUPPLIER',
      active: true,
    });

    const req = createMockReq({ originalUrl: '/api/supplier/inventory' } as Partial<Request>);

    await authenticate(req, createMockRes(), mockNext);

    expect(req.user).toEqual({
      id: 'supplier-dev',
      role: 'supplier',
      firebaseUid: 'dev-bypass',
    });
    expect(mockNext).toHaveBeenCalledWith();
  });

  it('auto-authenticates as transporter for /api/transporter routes', async () => {
    (prisma.staffUser.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'transporter-dev',
      role: 'TRANSPORTER',
      active: true,
    });

    const req = createMockReq({ originalUrl: '/api/transporter/deliveries' } as Partial<Request>);

    await authenticate(req, createMockRes(), mockNext);

    expect(req.user).toEqual({
      id: 'transporter-dev',
      role: 'transporter',
      firebaseUid: 'dev-bypass',
    });
    expect(mockNext).toHaveBeenCalledWith();
  });

  it('auto-authenticates as customer for other routes', async () => {
    (prisma.customer.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'cust-dev',
    });

    const req = createMockReq({ originalUrl: '/api/fridge/orders' } as Partial<Request>);

    await authenticate(req, createMockRes(), mockNext);

    expect(req.user).toEqual({
      id: 'cust-dev',
      role: 'customer',
      firebaseUid: 'dev-bypass',
    });
    expect(mockNext).toHaveBeenCalledWith();
  });

  it('falls back to admin when no matching user found for route', async () => {
    // No customer found for customer route
    (prisma.customer.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (prisma.adminUser.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'fallback-admin',
    });

    const req = createMockReq({ originalUrl: '/api/favorites' } as Partial<Request>);

    await authenticate(req, createMockRes(), mockNext);

    expect(req.user).toEqual({
      id: 'fallback-admin',
      role: 'admin',
      firebaseUid: 'dev-bypass',
    });
    expect(mockNext).toHaveBeenCalledWith();
  });

  it('falls back to admin when no producer found for /api/producer', async () => {
    (prisma.staffUser.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (prisma.adminUser.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'fallback-admin-2',
    });

    const req = createMockReq({ originalUrl: '/api/producer/orders' } as Partial<Request>);

    await authenticate(req, createMockRes(), mockNext);

    expect(req.user).toEqual({
      id: 'fallback-admin-2',
      role: 'admin',
      firebaseUid: 'dev-bypass',
    });
  });
});

describe('requireRole', () => {
  it('calls next when user has the required role', () => {
    const middleware = requireRole('admin');
    const req = createMockReq();
    req.user = { id: 'admin-1', role: 'admin', firebaseUid: 'fb-1' };
    const next = vi.fn();

    middleware(req, createMockRes(), next);

    expect(next).toHaveBeenCalledWith();
  });

  it('throws ApiError 403 when user does not have the required role', () => {
    const middleware = requireRole('admin');
    const req = createMockReq();
    req.user = { id: 'cust-1', role: 'customer', firebaseUid: 'fb-1' };
    const next = vi.fn();

    expect(() => middleware(req, createMockRes(), next)).toThrow(ApiError);
    expect(() => {
      const req2 = createMockReq();
      req2.user = { id: 'cust-1', role: 'customer', firebaseUid: 'fb-1' };
      middleware(req2, createMockRes(), next);
    }).toThrow('admin access required');
  });

  it('throws ApiError 403 when user is not set', () => {
    const middleware = requireRole('admin');
    const req = createMockReq();
    const next = vi.fn();

    expect(() => middleware(req, createMockRes(), next)).toThrow(ApiError);
  });

  it('accepts any of multiple roles', () => {
    const middleware = requireRole('admin', 'customer');
    const req = createMockReq();
    req.user = { id: 'cust-1', role: 'customer', firebaseUid: 'fb-1' };
    const next = vi.fn();

    middleware(req, createMockRes(), next);

    expect(next).toHaveBeenCalledWith();
  });

  it('provides descriptive error message for multiple roles', () => {
    const middleware = requireRole('producer', 'supplier', 'transporter');
    const req = createMockReq();
    req.user = { id: 'cust-1', role: 'customer', firebaseUid: 'fb-1' };
    const next = vi.fn();

    expect(() => middleware(req, createMockRes(), next)).toThrow(
      'producer or supplier or transporter access required'
    );
  });
});

describe('requireAdmin', () => {
  it('allows admin role through', () => {
    const req = createMockReq();
    req.user = { id: 'admin-1', role: 'admin', firebaseUid: 'fb-1' };
    const next = vi.fn();

    requireAdmin(req, createMockRes(), next);

    expect(next).toHaveBeenCalledWith();
  });

  it('rejects non-admin role', () => {
    const req = createMockReq();
    req.user = { id: 'cust-1', role: 'customer', firebaseUid: 'fb-1' };
    const next = vi.fn();

    expect(() => requireAdmin(req, createMockRes(), next)).toThrow(ApiError);
  });
});

describe('requireCustomer', () => {
  it('allows customer role through', () => {
    const req = createMockReq();
    req.user = { id: 'cust-1', role: 'customer', firebaseUid: 'fb-1' };
    const next = vi.fn();

    requireCustomer(req, createMockRes(), next);

    expect(next).toHaveBeenCalledWith();
  });

  it('rejects non-customer role', () => {
    const req = createMockReq();
    req.user = { id: 'admin-1', role: 'admin', firebaseUid: 'fb-1' };
    const next = vi.fn();

    expect(() => requireCustomer(req, createMockRes(), next)).toThrow(ApiError);
  });
});
