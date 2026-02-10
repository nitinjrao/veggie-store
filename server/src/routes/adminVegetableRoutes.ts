import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate, requireAdmin } from '../middleware/auth';
import {
  adminListVegetables,
  adminCreateVegetable,
  adminUpdateVegetable,
  adminDeleteVegetable,
} from '../controllers/adminVegetableController';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/', asyncHandler(adminListVegetables));
router.post('/', asyncHandler(adminCreateVegetable));
router.put('/:id', asyncHandler(adminUpdateVegetable));
router.delete('/:id', asyncHandler(adminDeleteVegetable));

export default router;

