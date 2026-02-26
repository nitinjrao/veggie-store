import { Request, Response, NextFunction } from 'express';
import { firebaseAuth } from '../lib/firebase';
import { prisma } from '../lib/prisma';
import { ApiError } from '../utils/ApiError';

type UserRole = 'customer' | 'admin' | 'producer' | 'supplier' | 'transporter';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: UserRole;
        firebaseUid: string;
      };
    }
  }
}

// Simple in-memory cache: firebaseUid -> { id, role, expiresAt }
const userCache = new Map<string, { id: string; role: UserRole; expiresAt: number }>();
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

export const authenticate = async (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  // Dev bypass: when Firebase isn't configured, auto-detect role from route
  if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    const path = req.originalUrl || req.url;

    if (path.startsWith('/api/admin') || path.startsWith('/api/staff')) {
      const firstAdmin = await prisma.adminUser.findFirst();
      if (firstAdmin) {
        req.user = { id: firstAdmin.id, role: 'admin', firebaseUid: 'dev-bypass' };
        return next();
      }
    } else if (path.startsWith('/api/producer')) {
      const producer = await prisma.staffUser.findFirst({
        where: { role: 'PRODUCER', active: true },
      });
      if (producer) {
        req.user = { id: producer.id, role: 'producer', firebaseUid: 'dev-bypass' };
        return next();
      }
    } else if (path.startsWith('/api/supplier')) {
      const supplier = await prisma.staffUser.findFirst({
        where: { role: 'SUPPLIER', active: true },
      });
      if (supplier) {
        req.user = { id: supplier.id, role: 'supplier', firebaseUid: 'dev-bypass' };
        return next();
      }
    } else if (path.startsWith('/api/transporter')) {
      const transporter = await prisma.staffUser.findFirst({
        where: { role: 'TRANSPORTER', active: true },
      });
      if (transporter) {
        req.user = { id: transporter.id, role: 'transporter', firebaseUid: 'dev-bypass' };
        return next();
      }
    } else {
      // Default: customer routes (fridge, orders, favorites, etc.)
      const customer = await prisma.customer.findFirst();
      if (customer) {
        req.user = { id: customer.id, role: 'customer', firebaseUid: 'dev-bypass' };
        return next();
      }
    }

    // Fallback to admin if no matching user found
    const fallbackAdmin = await prisma.adminUser.findFirst();
    if (fallbackAdmin) {
      req.user = { id: fallbackAdmin.id, role: 'admin', firebaseUid: 'dev-bypass' };
      return next();
    }
  }

  if (!authHeader?.startsWith('Bearer ')) {
    return next(new ApiError(401, 'No token provided'));
  }

  const idToken = authHeader.split(' ')[1];

  if (!firebaseAuth) {
    return next(new ApiError(401, 'Firebase auth not configured'));
  }

  try {
    const decoded = await firebaseAuth.verifyIdToken(idToken);
    const firebaseUid = decoded.uid;

    // Check cache first
    const cached = userCache.get(firebaseUid);
    if (cached && cached.expiresAt > Date.now()) {
      req.user = { id: cached.id, role: cached.role, firebaseUid };
      return next();
    }

    // Look up in Customer first, then AdminUser, then StaffUser
    const customer = await prisma.customer.findUnique({ where: { firebaseUid } });
    if (customer) {
      userCache.set(firebaseUid, {
        id: customer.id,
        role: 'customer',
        expiresAt: Date.now() + CACHE_TTL_MS,
      });
      req.user = { id: customer.id, role: 'customer', firebaseUid };
      return next();
    }

    const admin = await prisma.adminUser.findUnique({ where: { firebaseUid } });
    if (admin) {
      userCache.set(firebaseUid, {
        id: admin.id,
        role: 'admin',
        expiresAt: Date.now() + CACHE_TTL_MS,
      });
      req.user = { id: admin.id, role: 'admin', firebaseUid };
      return next();
    }

    const staffUser = await prisma.staffUser.findUnique({ where: { firebaseUid } });
    if (staffUser && staffUser.active) {
      const staffRole = staffUser.role.toLowerCase() as UserRole;
      userCache.set(firebaseUid, {
        id: staffUser.id,
        role: staffRole,
        expiresAt: Date.now() + CACHE_TTL_MS,
      });
      req.user = { id: staffUser.id, role: staffRole, firebaseUid };
      return next();
    }

    return next(new ApiError(401, 'User not found'));
  } catch (err) {
    if (err instanceof ApiError) return next(err);
    return next(new ApiError(401, 'Invalid or expired token'));
  }
};

export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new ApiError(403, `${roles.join(' or ')} access required`);
    }
    next();
  };
}

// Backward-compatible aliases
export const requireAdmin = requireRole('admin');
export const requireCustomer = requireRole('customer');
export const requireStaff = requireRole('producer', 'supplier', 'transporter');
export const requireProducer = requireRole('producer');
export const requireSupplier = requireRole('supplier');
export const requireTransporter = requireRole('transporter');
