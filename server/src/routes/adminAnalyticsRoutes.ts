import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate, requireAdmin } from '../middleware/auth';
import {
  getSalesData,
  getTopProducts,
  getSalesSummary,
  exportSalesCsv,
} from '../controllers/adminAnalyticsController';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/sales', asyncHandler(getSalesData));
router.get('/top-products', asyncHandler(getTopProducts));
router.get('/summary', asyncHandler(getSalesSummary));
router.get('/export', asyncHandler(exportSalesCsv));

export default router;
