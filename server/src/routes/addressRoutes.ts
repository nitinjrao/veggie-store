import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate, requireCustomer } from '../middleware/auth';
import {
  listAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
} from '../controllers/addressController';

const router = Router();

router.use(authenticate, requireCustomer);

router.get('/', asyncHandler(listAddresses));
router.post('/', asyncHandler(createAddress));
router.patch('/:id', asyncHandler(updateAddress));
router.delete('/:id', asyncHandler(deleteAddress));

export default router;
