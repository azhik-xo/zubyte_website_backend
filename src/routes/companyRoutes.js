import express from 'express';
import {
  getCompanyInfo,
  updateCompanyInfo,
  getClientLogos,
  updateClientLogos,
  addClientLogo,
  deleteClientLogo,
  updateCompanyStats,
  updateLeadership,
  updateCoreValues,
  updateStoryMilestones,
  updateOffices,
  getFaqs,
  updateFaqs,
} from '../controllers/companyController.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = express.Router();

// ─── PUBLIC ROUTES ───────────────────────────────────────────────────────────
router.get('/company', getCompanyInfo);
router.get('/company/clients', getClientLogos);
router.get('/clients', getClientLogos);
router.get('/faqs', getFaqs);

// ─── PROTECTED ROUTES (Admin & Developer) ────────────────────────────────────
router.put('/company', protect, authorize('admin', 'developer'), updateCompanyInfo);
router.put('/company/clients', protect, authorize('admin', 'developer'), updateClientLogos);
router.post('/company/clients', protect, authorize('admin', 'developer'), addClientLogo);
router.delete('/company/clients/:id', protect, authorize('admin', 'developer'), deleteClientLogo);
router.put('/company/stats', protect, authorize('admin', 'developer'), updateCompanyStats);
router.put('/company/leadership', protect, authorize('admin', 'developer'), updateLeadership);
router.put('/company/values', protect, authorize('admin', 'developer'), updateCoreValues);
router.put('/company/milestones', protect, authorize('admin', 'developer'), updateStoryMilestones);
router.put('/company/offices', protect, authorize('admin', 'developer'), updateOffices);
router.put('/company/faqs', protect, authorize('admin', 'developer'), updateFaqs);

export default router;
