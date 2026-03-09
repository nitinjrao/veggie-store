import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate, requireProducer } from '../middleware/auth';
import {
  listFridges,
  getFridgeInventory,
  loadFridge,
  getMyTransactions,
  getOrderSummary,
  getPendingOrders,
  getAllOrders,
  getProcurementView,
  confirmOrder,
  markOrderReady,
  getCumulativeView,
  getAssemblyView,
} from '../controllers/producerFridgeController';

const router = Router();

router.use(authenticate, requireProducer);

// /orders/* and /transactions/mine MUST be before /:id to avoid param conflict
router.get('/orders/cumulative', asyncHandler(getCumulativeView));
router.get('/orders/assembly', asyncHandler(getAssemblyView));
router.get('/orders/summary', asyncHandler(getOrderSummary));
router.get('/orders/pending', asyncHandler(getPendingOrders));
router.get('/orders/all', asyncHandler(getAllOrders));
router.get('/orders/procurement', asyncHandler(getProcurementView));
router.put('/orders/:id/confirm', asyncHandler(confirmOrder));
router.put('/orders/:id/ready', asyncHandler(markOrderReady));
router.get('/transactions/mine', asyncHandler(getMyTransactions));
router.get('/', asyncHandler(listFridges));
router.get('/:id/inventory', asyncHandler(getFridgeInventory));
router.post('/:id/load', asyncHandler(loadFridge));

export default router;
