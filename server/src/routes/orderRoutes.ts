import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate, requireCustomer } from '../middleware/auth';
import { placeOrder, getMyOrders, getOrderById } from '../controllers/orderController';

const router = Router();

router.use(authenticate, requireCustomer);

router.post('/', asyncHandler(placeOrder));
router.get('/', asyncHandler(getMyOrders));
router.get('/:id', asyncHandler(getOrderById));

export default router;
