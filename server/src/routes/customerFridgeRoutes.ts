import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate, requireCustomer } from '../middleware/auth';
import {
  listLocations,
  getFridgeInventory,
  placePickupOrder,
  getMyPickupOrders,
  getPickupOrder,
  markPickupOrderPaid,
} from '../controllers/customerFridgeController';

const router = Router();

// Public routes (no auth required)
router.get('/locations', asyncHandler(listLocations));
router.get('/fridges/:id', asyncHandler(getFridgeInventory));

// Authenticated customer routes
router.post('/pickup-orders', authenticate, requireCustomer, asyncHandler(placePickupOrder));
router.get('/pickup-orders', authenticate, requireCustomer, asyncHandler(getMyPickupOrders));
router.get('/pickup-orders/:id', authenticate, requireCustomer, asyncHandler(getPickupOrder));
router.put(
  '/pickup-orders/:id/mark-paid',
  authenticate,
  requireCustomer,
  asyncHandler(markPickupOrderPaid)
);

export default router;
