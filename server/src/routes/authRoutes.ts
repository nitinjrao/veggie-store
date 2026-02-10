import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import {
  adminLogin,
  customerRegister,
  customerLogin,
  verifyOtp,
} from '../controllers/authController';

const router = Router();

router.post('/admin/login', asyncHandler(adminLogin));
router.post('/customer/register', asyncHandler(customerRegister));
router.post('/customer/login', asyncHandler(customerLogin));
router.post('/customer/verify-otp', asyncHandler(verifyOtp));

export default router;
