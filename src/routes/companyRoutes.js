import express from 'express';
import { getCompanyInfo, getFaqs } from '../controllers/companyController.js';

const router = express.Router();

router.get('/company', getCompanyInfo);
router.get('/faqs', getFaqs);

export default router;

