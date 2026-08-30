import express from 'express';
import {
  getAllServices,
  getServiceBySlug,
  createServiceGroup,
  updateServiceGroup,
  deleteServiceGroup,
} from '../controllers/serviceController.js';
import { requireFields } from '../middlewares/validate.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = express.Router();

router.get('/', getAllServices);
router.get('/:slug', getServiceBySlug);

// Protected Admin & Developer endpoints
router.post(
  '/',
  protect,
  requireFields(['group', 'slug', 'tagline']),
  createServiceGroup
);
router.put('/:id', protect, updateServiceGroup);
router.delete('/:id', protect, authorize('admin'), deleteServiceGroup);

export default router;
