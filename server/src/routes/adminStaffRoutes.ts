import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate, requireAdmin } from '../middleware/auth';
import {
  listStaff,
  createStaff,
  getStaff,
  updateStaff,
  deactivateStaff,
  setStaffPassword,
} from '../controllers/adminStaffController';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/', asyncHandler(listStaff));
router.post('/', asyncHandler(createStaff));
router.get('/:id', asyncHandler(getStaff));
router.put('/:id', asyncHandler(updateStaff));
router.put('/:id/password', asyncHandler(setStaffPassword));
router.delete('/:id', asyncHandler(deactivateStaff));

export default router;
