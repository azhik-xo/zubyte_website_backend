import mongoose from 'mongoose';
import { Company } from '../models/Company.js';
import { COMPANY_SEED } from '../seeds/seedData.js';
import { ApiResponse } from '../utils/apiResponse.js';

let inMemoryCompany = JSON.parse(JSON.stringify(COMPANY_SEED));

/**
 * @desc    Get company identity, metrics, leadership, and global offices
 * @route   GET /api/company
 * @access  Public
 */
export const getCompanyInfo = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState === 1) {
      let company = await Company.findOne();
      if (!company) {
        company = inMemoryCompany;
      }
      return ApiResponse.success(res, company, 'Company information retrieved');
    }

    return ApiResponse.success(res, inMemoryCompany, 'Company information retrieved (offline mode)');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all FAQs
 * @route   GET /api/faqs
 * @access  Public
 */
export const getFaqs = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const company = await Company.findOne();
      const faqs = company && company.faqs ? company.faqs : inMemoryCompany.faqs || [];
      return ApiResponse.success(res, faqs, 'FAQs retrieved');
    }

    const faqs = inMemoryCompany && inMemoryCompany.faqs ? inMemoryCompany.faqs : [];
    return ApiResponse.success(res, faqs, 'FAQs retrieved (offline mode)');
  } catch (error) {
    next(error);
  }
};
