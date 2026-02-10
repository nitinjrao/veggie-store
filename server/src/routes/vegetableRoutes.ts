import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import {
  listVegetables,
  getVegetableById,
  getVegetablesByCategory,
  searchVegetables,
} from '../controllers/vegetableController';

const router = Router();

// Specific routes BEFORE param routes
router.get('/search', asyncHandler(searchVegetables));
router.get('/category/:id', asyncHandler(getVegetablesByCategory));
router.get('/', asyncHandler(listVegetables));
router.get('/:id', asyncHandler(getVegetableById));

export default router;
