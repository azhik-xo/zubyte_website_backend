import express from 'express';
import {
  submitInquiry,
  getInquiries,
  getInquiryById,
  updateInquiryStatus,
  deleteInquiry,
} from '../controllers/contactController.js';
import { uploadAttachment } from '../middlewares/upload.js';
import { contactFormLimiter } from '../middlewares/rateLimiter.js';
import { requireFields, validateEmail } from '../middlewares/validate.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = express.Router();

// Public contact submission with rate limiting and file upload
router.post(
  '/',
  contactFormLimiter,
  uploadAttachment.single('attachment'),
  requireFields(['firstName', 'lastName', 'email', 'message']),
  validateEmail,
  submitInquiry
);

// Protected Admin & Developer inquiry management
router.get('/', protect, getInquiries);
router.get('/:id', protect, getInquiryById);
router.patch('/:id', protect, updateInquiryStatus);

// Delete inquiry (Admin & Developer)
router.delete('/:id', protect, authorize('admin', 'developer'), deleteInquiry);

export default router;
