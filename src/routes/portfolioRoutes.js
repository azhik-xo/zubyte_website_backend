import express from 'express';
import {
  getCaseStudies,
  getCaseStudyById,
  createCaseStudy,
  updateCaseStudy,
  deleteCaseStudy,
} from '../controllers/portfolioController.js';
import { requireFields } from '../middlewares/validate.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = express.Router();

router.get('/', getCaseStudies);
router.get('/:id', getCaseStudyById);

// Protected Admin & Developer mutations
router.post(
  '/',
  protect,
  requireFields(['title', 'service', 'group', 'img', 'shortDesc', 'stars']),
  createCaseStudy
);
router.put('/:id', protect, updateCaseStudy);
router.delete('/:id', protect, authorize('admin', 'developer'), deleteCaseStudy);

export default router;
