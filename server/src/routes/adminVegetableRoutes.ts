import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate, requireAdmin } from '../middleware/auth';
import {
  adminListVegetables,
  adminCreateVegetable,
  adminUpdateVegetable,
  adminDeleteVegetable,
  adminBulkUpdateStock,
  adminGetPriceHistory,
  adminUploadImage,
} from '../controllers/adminVegetableController';
import { upload } from '../middleware/upload';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/', asyncHandler(adminListVegetables));
router.post('/upload', upload.single('image'), asyncHandler(adminUploadImage));
router.post('/', asyncHandler(adminCreateVegetable));
router.put('/bulk-stock', asyncHandler(adminBulkUpdateStock));
router.get('/:id/price-history', asyncHandler(adminGetPriceHistory));
router.put('/:id', asyncHandler(adminUpdateVegetable));
router.delete('/:id', asyncHandler(adminDeleteVegetable));

export default router;

