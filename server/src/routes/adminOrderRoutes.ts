import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate, requireAdmin } from '../middleware/auth';
import {
  adminListOrders,
  adminGetOrder,
  adminUpdateOrderStatus,
} from '../controllers/adminOrderController';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/', asyncHandler(adminListOrders));
router.get('/:id', asyncHandler(adminGetOrder));
router.put('/:id/status', asyncHandler(adminUpdateOrderStatus));

export default router;
