import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate, requireCustomer } from '../middleware/auth';
import { getProfileCompleteness } from '../controllers/customerFridgeController';

const router = Router();

router.use(authenticate, requireCustomer);

router.get('/profile/completeness', asyncHandler(getProfileCompleteness));

export default router;
