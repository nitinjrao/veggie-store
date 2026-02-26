import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate, requireAdmin } from '../middleware/auth';
import {
  listLocations,
  createLocation,
  getLocation,
  updateLocation,
  deleteLocation,
} from '../controllers/adminLocationController';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/', asyncHandler(listLocations));
router.post('/', asyncHandler(createLocation));
router.get('/:id', asyncHandler(getLocation));
router.put('/:id', asyncHandler(updateLocation));
router.delete('/:id', asyncHandler(deleteLocation));

export default router;
