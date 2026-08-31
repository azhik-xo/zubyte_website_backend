import express from 'express';
import {
  getCompanyInfo,
  getClientLogos,
  updateClientLogos,
  addClientLogo,
  deleteClientLogo,
  updateCompanyStats,
  getFaqs,
} from '../controllers/companyController.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = express.Router();

// Public routes
router.get('/company', getCompanyInfo);
router.get('/company/clients', getClientLogos);
router.get('/clients', getClientLogos);
router.get('/faqs', getFaqs);

// Protected routes (Admin & Developer)
router.put('/company/clients', protect, authorize('admin', 'developer'), updateClientLogos);
router.post('/company/clients', protect, authorize('admin', 'developer'), addClientLogo);
router.delete('/company/clients/:id', protect, authorize('admin', 'developer'), deleteClientLogo);
router.put('/company/stats', protect, authorize('admin', 'developer'), updateCompanyStats);

export default router;
