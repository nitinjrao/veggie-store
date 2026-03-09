import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate, requireCustomer } from '../middleware/auth';
import {
  getNotifications,
  markAsRead,
  getUnreadCount,
} from '../controllers/notificationController';

const router = Router();

router.use(authenticate, requireCustomer);

router.get('/unread-count', asyncHandler(getUnreadCount));
router.get('/', asyncHandler(getNotifications));
router.put('/:id/read', asyncHandler(markAsRead));

export default router;
