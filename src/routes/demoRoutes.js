import express from 'express';
import {
  requestDemo,
  getAllDemoRequests,
  updateDemoStatus,
  deleteDemo,
  subscribeNewsletter,
  getSubscribers,
  deleteSubscriber,
} from '../controllers/demoController.js';
import { contactFormLimiter } from '../middlewares/rateLimiter.js';
import { requireFields, validateEmail } from '../middlewares/validate.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = express.Router();

// Public Demo Booking
router.post(
  '/demo',
  contactFormLimiter,
  requireFields(['name', 'email']),
  validateEmail,
  requestDemo
);

// Protected Admin & Developer Demo List
router.get('/demo', protect, getAllDemoRequests);

// Update demo request status
router.patch('/demo/:id', protect, updateDemoStatus);

// Delete demo request (Admin only)
router.delete('/demo/:id', protect, authorize('admin'), deleteDemo);

// Newsletter Subscription (Public)
router.post(
  '/newsletter',
  contactFormLimiter,
  requireFields(['email']),
  validateEmail,
  subscribeNewsletter
);

// Protected Newsletter subscribers list
router.get('/newsletter', protect, getSubscribers);

// Delete subscriber (Admin only)
router.delete('/newsletter/:id', protect, authorize('admin'), deleteSubscriber);

export default router;
