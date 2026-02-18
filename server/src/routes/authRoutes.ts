import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate, requireCustomer } from '../middleware/auth';
import {
  customerFirebaseLogin,
  adminFirebaseLogin,
  getProfile,
  updateProfile,
} from '../controllers/authController';

const router = Router();

router.post('/customer/firebase-login', asyncHandler(customerFirebaseLogin));
router.post('/admin/firebase-login', asyncHandler(adminFirebaseLogin));

router.get('/profile', authenticate, requireCustomer, asyncHandler(getProfile));
router.patch('/profile', authenticate, requireCustomer, asyncHandler(updateProfile));

export default router;
