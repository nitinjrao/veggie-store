import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { ApiError } from '../utils/ApiError';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: 'customer' | 'admin';
      };
    }
  }
}

export const authenticate = (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new ApiError(401, 'No token provided');
  }

  try {
    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch {
    throw new ApiError(401, 'Invalid or expired token');
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
