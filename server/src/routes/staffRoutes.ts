import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { staffFirebaseLogin } from '../controllers/staffController';

const router = Router();

router.post('/firebase-login', asyncHandler(staffFirebaseLogin));

export default router;
