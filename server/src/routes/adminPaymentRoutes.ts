import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate, requireAdmin } from '../middleware/auth';
import { getPaymentSummary } from '../controllers/paymentController';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/payments/summary', asyncHandler(getPaymentSummary));

export default router;
