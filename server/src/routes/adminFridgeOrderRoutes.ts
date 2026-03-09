import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate, requireAdmin } from '../middleware/auth';
import { upload } from '../middleware/upload';
import {
  listFridgeOrders,
  getFridgeOrder,
  updateFridgeOrderStatus,
  logFridgePayment,
  assignFridgeOrder,
  getFridgePendingCounts,
  getFridgeActiveOrders,
  modifyOrder,
  quickConfirmOrder,
} from '../controllers/adminFridgeOrderController';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/pending-counts', asyncHandler(getFridgePendingCounts));
router.get('/by-fridge/:fridgeId', asyncHandler(getFridgeActiveOrders));
router.get('/', asyncHandler(listFridgeOrders));
router.get('/:id', asyncHandler(getFridgeOrder));
router.put('/:id/status', asyncHandler(updateFridgeOrderStatus));
router.put('/:id/modify', asyncHandler(modifyOrder));
router.put('/:id/quick-confirm', asyncHandler(quickConfirmOrder));
router.put('/:id/assign', asyncHandler(assignFridgeOrder));
router.post('/:id/payments', upload.single('screenshot'), asyncHandler(logFridgePayment));

export default router;
