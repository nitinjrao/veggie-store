import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate, requireAdmin } from '../middleware/auth';
import {
  adminListCategories,
  adminCreateCategory,
  adminUpdateCategory,
  adminDeleteCategory,
} from '../controllers/adminCategoryController';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/', asyncHandler(adminListCategories));
router.post('/', asyncHandler(adminCreateCategory));
router.put('/:id', asyncHandler(adminUpdateCategory));
router.delete('/:id', asyncHandler(adminDeleteCategory));

export default router;
