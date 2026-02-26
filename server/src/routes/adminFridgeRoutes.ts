import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate, requireAdmin } from '../middleware/auth';
import {
  listFridges,
  createFridge,
  getFridge,
  updateFridge,
  deleteFridge,
  updateInventory,
  getLowStockAlerts,
  getFridgeProducers,
  assignProducerToFridge,
  unassignProducerFromFridge,
} from '../controllers/adminFridgeController';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/alerts/low-stock', asyncHandler(getLowStockAlerts));
router.get('/', asyncHandler(listFridges));
router.post('/', asyncHandler(createFridge));
router.get('/:id', asyncHandler(getFridge));
router.put('/:id', asyncHandler(updateFridge));
router.delete('/:id', asyncHandler(deleteFridge));
router.put('/:id/inventory', asyncHandler(updateInventory));
router.get('/:id/producers', asyncHandler(getFridgeProducers));
router.post('/:id/producers', asyncHandler(assignProducerToFridge));
router.delete('/:id/producers/:staffId', asyncHandler(unassignProducerFromFridge));

export default router;
