import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import {
  listVegetables,
  listFeaturedVegetables,
  getVegetableById,
  getVegetablesByCategory,
  searchVegetables,
  getWarehouseAvailable,
} from '../controllers/vegetableController';

const router = Router();

// Specific routes BEFORE param routes
router.get('/search', asyncHandler(searchVegetables));
router.get('/featured', asyncHandler(listFeaturedVegetables));
router.get('/warehouse-available', asyncHandler(getWarehouseAvailable));
router.get('/category/:id', asyncHandler(getVegetablesByCategory));
router.get('/', asyncHandler(listVegetables));
router.get('/:id', asyncHandler(getVegetableById));

export default router;
