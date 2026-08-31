import mongoose from 'mongoose';
import { Company } from '../models/Company.js';
import { COMPANY_SEED } from '../seeds/seedData.js';
import { ApiResponse } from '../utils/apiResponse.js';

let inMemoryCompany = JSON.parse(JSON.stringify(COMPANY_SEED));

/**
 * Helper to get or create single company document
 */
const getOrCreateCompany = async () => {
  let company = await Company.findOne();
  if (!company) {
    company = await Company.create(COMPANY_SEED);
  }
  // Ensure clientLogos exists
  if (!company.clientLogos || company.clientLogos.length === 0) {
    company.clientLogos = COMPANY_SEED.clientLogos || [];
    await company.save();
  }
  return company;
};

/**
 * @desc    Get company identity, metrics, leadership, global offices, and client logos
 * @route   GET /api/company
 * @access  Public
 */
export const getCompanyInfo = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const company = await getOrCreateCompany();
      return ApiResponse.success(res, company, 'Company information retrieved');
    }

    return ApiResponse.success(res, inMemoryCompany, 'Company information retrieved (offline mode)');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all client logos / marquee partners
 * @route   GET /api/company/clients (or /api/clients)
 * @access  Public
 */
export const getClientLogos = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const company = await getOrCreateCompany();
      const clientLogos = company.clientLogos || [];
      return ApiResponse.success(res, clientLogos, 'Client logos retrieved');
    }

    const clientLogos = inMemoryCompany.clientLogos || [];
    return ApiResponse.success(res, clientLogos, 'Client logos retrieved (offline mode)');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update all client logos
 * @route   PUT /api/company/clients
 * @access  Private (Admin, Developer)
 */
export const updateClientLogos = async (req, res, next) => {
  try {
    const { clientLogos } = req.body;

    if (!Array.isArray(clientLogos)) {
      return ApiResponse.badRequest(res, 'clientLogos must be an array');
    }

    if (mongoose.connection.readyState === 1) {
      const company = await getOrCreateCompany();
      company.clientLogos = clientLogos;
      await company.save();
      return ApiResponse.success(res, company.clientLogos, 'Client logos updated successfully');
    }

    inMemoryCompany.clientLogos = clientLogos;
    return ApiResponse.success(res, inMemoryCompany.clientLogos, 'Client logos updated (offline mode)');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add single client logo
 * @route   POST /api/company/clients
 * @access  Private (Admin, Developer)
 */
export const addClientLogo = async (req, res, next) => {
  try {
    const { name, logoUrl, active = true } = req.body;

    if (!name || !name.trim()) {
      return ApiResponse.badRequest(res, 'Client name is required');
    }

    const newClient = {
      name: name.trim(),
      logoUrl: logoUrl ? logoUrl.trim() : '',
      active,
      order: Date.now(),
    };

    if (mongoose.connection.readyState === 1) {
      const company = await getOrCreateCompany();
      company.clientLogos.push(newClient);
      await company.save();
      return ApiResponse.created(res, company.clientLogos, 'Client added successfully');
    }

    if (!inMemoryCompany.clientLogos) inMemoryCompany.clientLogos = [];
    inMemoryCompany.clientLogos.push({ _id: `temp_${Date.now()}`, ...newClient });
    return ApiResponse.created(res, inMemoryCompany.clientLogos, 'Client added (offline mode)');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete single client logo by ID
 * @route   DELETE /api/company/clients/:id
 * @access  Private (Admin, Developer)
 */
export const deleteClientLogo = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState === 1) {
      const company = await getOrCreateCompany();
      company.clientLogos = company.clientLogos.filter((c) => c._id.toString() !== id);
      await company.save();
      return ApiResponse.success(res, company.clientLogos, 'Client deleted successfully');
    }

    inMemoryCompany.clientLogos = (inMemoryCompany.clientLogos || []).filter((c) => c._id !== id);
    return ApiResponse.success(res, inMemoryCompany.clientLogos, 'Client deleted (offline mode)');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update stats / social proof numbers
 * @route   PUT /api/company/stats
 * @access  Private (Admin, Developer)
 */
export const updateCompanyStats = async (req, res, next) => {
  try {
    const { stats } = req.body;

    if (!Array.isArray(stats)) {
      return ApiResponse.badRequest(res, 'stats must be an array');
    }

    if (mongoose.connection.readyState === 1) {
      const company = await getOrCreateCompany();
      company.stats = stats;
      await company.save();
      return ApiResponse.success(res, company.stats, 'Company stats updated successfully');
    }

    inMemoryCompany.stats = stats;
    return ApiResponse.success(res, inMemoryCompany.stats, 'Company stats updated (offline mode)');
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
      const company = await getOrCreateCompany();
      const faqs = company && company.faqs ? company.faqs : inMemoryCompany.faqs || [];
      return ApiResponse.success(res, faqs, 'FAQs retrieved');
    }

    const faqs = inMemoryCompany && inMemoryCompany.faqs ? inMemoryCompany.faqs : [];
    return ApiResponse.success(res, faqs, 'FAQs retrieved (offline mode)');
  } catch (error) {
    next(error);
  }
};
