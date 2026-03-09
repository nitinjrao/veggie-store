import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate, requireTransporter } from '../middleware/auth';
import {
  getMyDashboard,
  getAvailableOrders,
  getMyOrders,
  claimOrder,
  markPickedUp,
  deliverOrder,
  getLoadingChecklist,
} from '../controllers/transporterController';

const router = Router();

router.use(authenticate, requireTransporter);

router.get('/dashboard', asyncHandler(getMyDashboard));
router.get('/orders/available', asyncHandler(getAvailableOrders));
router.get('/orders/mine', asyncHandler(getMyOrders));
router.post('/orders/:id/claim', asyncHandler(claimOrder));
router.patch('/orders/:id/pickup', asyncHandler(markPickedUp));
router.patch('/orders/:id/deliver', asyncHandler(deliverOrder));
router.get('/orders/:id/loading-checklist', asyncHandler(getLoadingChecklist));

export default router;
