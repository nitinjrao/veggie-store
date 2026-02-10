import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate, requireCustomer } from '../middleware/auth';
import {
  getFavorites,
  getFavoriteIds,
  addFavorite,
  removeFavorite,
} from '../controllers/favoriteController';

const router = Router();

router.use(authenticate, requireCustomer);

router.get('/', asyncHandler(getFavorites));
router.get('/ids', asyncHandler(getFavoriteIds));
router.post('/:vegetableId', asyncHandler(addFavorite));
router.delete('/:vegetableId', asyncHandler(removeFavorite));

export default router;
