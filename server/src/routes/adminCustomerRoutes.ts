import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate, requireAdmin } from '../middleware/auth';
import { adminListCustomers, adminGetCustomer } from '../controllers/adminCustomerController';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/', asyncHandler(adminListCustomers));
router.get('/:id', asyncHandler(adminGetCustomer));

export default router;
