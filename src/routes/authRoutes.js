import express from 'express';
import { login, getMe, getAllUsers } from '../controllers/authController.js';
import { protect, authorize } from '../middlewares/auth.js';
import { contactFormLimiter } from '../middlewares/rateLimiter.js';

const router = express.Router();

router.post('/login', contactFormLimiter, login);
router.get('/me', protect, getMe);
router.get('/users', protect, authorize('admin'), getAllUsers);

export default router;

