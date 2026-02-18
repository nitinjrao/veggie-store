import { Request, Response, NextFunction } from 'express';
import { firebaseAuth } from '../lib/firebase';
import { prisma } from '../lib/prisma';
import { ApiError } from '../utils/ApiError';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: 'customer' | 'admin';
        firebaseUid: string;
      };
    }
  }
}

// Simple in-memory cache: firebaseUid -> { id, role, expiresAt }
const userCache = new Map<string, { id: string; role: 'customer' | 'admin'; expiresAt: number }>();
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

export const authenticate = async (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next(new ApiError(401, 'No token provided'));
  }

  const idToken = authHeader.split(' ')[1];

  try {
    const decoded = await firebaseAuth.verifyIdToken(idToken);
    const firebaseUid = decoded.uid;

    // Check cache first
    const cached = userCache.get(firebaseUid);
    if (cached && cached.expiresAt > Date.now()) {
      req.user = { id: cached.id, role: cached.role, firebaseUid };
      return next();
    }

    // Look up in Customer first, then AdminUser
    const customer = await prisma.customer.findUnique({ where: { firebaseUid } });
    if (customer) {
      userCache.set(firebaseUid, { id: customer.id, role: 'customer', expiresAt: Date.now() + CACHE_TTL_MS });
      req.user = { id: customer.id, role: 'customer', firebaseUid };
      return next();
    }

    const admin = await prisma.adminUser.findUnique({ where: { firebaseUid } });
    if (admin) {
      userCache.set(firebaseUid, { id: admin.id, role: 'admin', expiresAt: Date.now() + CACHE_TTL_MS });
      req.user = { id: admin.id, role: 'admin', firebaseUid };
      return next();
    }

    return next(new ApiError(401, 'User not found'));
  } catch (err) {
    if (err instanceof ApiError) return next(err);
    return next(new ApiError(401, 'Invalid or expired token'));
  }
};

export const requireAdmin = (req: Request, _res: Response, next: NextFunction) => {
  if (req.user?.role !== 'admin') {
    throw new ApiError(403, 'Admin access required');
  }
  next();
};

export const requireCustomer = (req: Request, _res: Response, next: NextFunction) => {
  if (req.user?.role !== 'customer') {
    throw new ApiError(403, 'Customer access required');
  }
  next();
};
