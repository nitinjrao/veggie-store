import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate, requireAdmin } from '../middleware/auth';
import { getDashboardStats } from '../controllers/adminDashboardController';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/stats', asyncHandler(getDashboardStats));

export default router;
