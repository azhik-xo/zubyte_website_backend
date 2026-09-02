import mongoose from 'mongoose';
import { Company } from '../models/Company.js';
import { COMPANY_SEED } from '../seeds/seedData.js';
import { ApiResponse } from '../utils/apiResponse.js';

let inMemoryCompany = JSON.parse(JSON.stringify(COMPANY_SEED));

/**
 * Helper to get or create single company document
 * Upgrades existing records with any missing fields from COMPANY_SEED
 */
const getOrCreateCompany = async () => {
  let company = await Company.findOne();
  if (!company) {
    company = await Company.create(COMPANY_SEED);
    return company;
  }

  let modified = false;

  // Ensure clientLogos exists
  if (!company.clientLogos || company.clientLogos.length === 0) {
    company.clientLogos = COMPANY_SEED.clientLogos || [];
    modified = true;
  }

  // Ensure coreValues exists
  if (!company.coreValues || company.coreValues.length === 0) {
    company.coreValues = COMPANY_SEED.coreValues || [];
    modified = true;
  }

  // Ensure storyMilestones exists
  if (!company.storyMilestones || company.storyMilestones.length === 0) {
    company.storyMilestones = COMPANY_SEED.storyMilestones || [];
    modified = true;
  }

  // Ensure offices exists
  if (!company.offices || company.offices.length === 0) {
    company.offices = COMPANY_SEED.offices || [];
    modified = true;
  }

  // Ensure leadership exists
  if (!company.leadership || !company.leadership.name) {
    company.leadership = COMPANY_SEED.leadership;
    modified = true;
  } else if (!company.leadership.initials) {
    company.leadership.initials = COMPANY_SEED.leadership.initials || 'DM';
    modified = true;
  }

  if (!company.shortName) {
    company.shortName = COMPANY_SEED.shortName || 'Zubyte';
    modified = true;
  }

  if (!company.foundedYear) {
    company.foundedYear = COMPANY_SEED.foundedYear || '2025';
    modified = true;
  }

  if (modified) {
    await company.save();
  }

  return company;
};

/**
 * @desc    Get complete company identity, metrics, leadership, values, milestones, offices, and client logos
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
 * @desc    Update company general information
 * @route   PUT /api/company
 * @access  Private (Admin, Developer)
 */
export const updateCompanyInfo = async (req, res, next) => {
  try {
    const updateData = req.body;

    if (mongoose.connection.readyState === 1) {
      const company = await getOrCreateCompany();

      // Update fields if provided
      const fields = [
        'name',
        'legalName',
        'shortName',
        'tagline',
        'description',
        'email',
        'phone',
        'foundedYear',
      ];

      fields.forEach((field) => {
        if (updateData[field] !== undefined) {
          company[field] = updateData[field];
        }
      });

      if (updateData.leadership) {
        company.leadership = {
          ...company.leadership,
          ...updateData.leadership,
        };
      }

      if (Array.isArray(updateData.stats)) {
        company.stats = updateData.stats;
      }

      if (Array.isArray(updateData.coreValues)) {
        company.coreValues = updateData.coreValues;
      }

      if (Array.isArray(updateData.storyMilestones)) {
        company.storyMilestones = updateData.storyMilestones;
      }

      if (Array.isArray(updateData.offices)) {
        company.offices = updateData.offices;
      }

      if (Array.isArray(updateData.faqs)) {
        company.faqs = updateData.faqs;
      }

      if (Array.isArray(updateData.clientLogos)) {
        company.clientLogos = updateData.clientLogos;
      }

      await company.save();
      return ApiResponse.success(res, company, 'Company information updated successfully');
    }

    inMemoryCompany = {
      ...inMemoryCompany,
      ...updateData,
    };
    return ApiResponse.success(res, inMemoryCompany, 'Company updated (offline mode)');
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
 * @desc    Update Leadership Information
 * @route   PUT /api/company/leadership
 * @access  Private (Admin, Developer)
 */
export const updateLeadership = async (req, res, next) => {
  try {
    const leadershipData = req.body;

    if (mongoose.connection.readyState === 1) {
      const company = await getOrCreateCompany();
      company.leadership = {
        ...company.leadership,
        ...leadershipData,
      };
      await company.save();
      return ApiResponse.success(res, company.leadership, 'Leadership updated successfully');
    }

    inMemoryCompany.leadership = { ...inMemoryCompany.leadership, ...leadershipData };
    return ApiResponse.success(res, inMemoryCompany.leadership, 'Leadership updated (offline mode)');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update Core Values / Principles
 * @route   PUT /api/company/values
 * @access  Private (Admin, Developer)
 */
export const updateCoreValues = async (req, res, next) => {
  try {
    const { coreValues } = req.body;

    if (!Array.isArray(coreValues)) {
      return ApiResponse.badRequest(res, 'coreValues must be an array');
    }

    if (mongoose.connection.readyState === 1) {
      const company = await getOrCreateCompany();
      company.coreValues = coreValues;
      await company.save();
      return ApiResponse.success(res, company.coreValues, 'Core values updated successfully');
    }

    inMemoryCompany.coreValues = coreValues;
    return ApiResponse.success(res, inMemoryCompany.coreValues, 'Core values updated (offline mode)');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update Story Milestones
 * @route   PUT /api/company/milestones
 * @access  Private (Admin, Developer)
 */
export const updateStoryMilestones = async (req, res, next) => {
  try {
    const { storyMilestones } = req.body;

    if (!Array.isArray(storyMilestones)) {
      return ApiResponse.badRequest(res, 'storyMilestones must be an array');
    }

    if (mongoose.connection.readyState === 1) {
      const company = await getOrCreateCompany();
      company.storyMilestones = storyMilestones;
      await company.save();
      return ApiResponse.success(res, company.storyMilestones, 'Story milestones updated successfully');
    }

    inMemoryCompany.storyMilestones = storyMilestones;
    return ApiResponse.success(res, inMemoryCompany.storyMilestones, 'Story milestones updated (offline mode)');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update Global Offices
 * @route   PUT /api/company/offices
 * @access  Private (Admin, Developer)
 */
export const updateOffices = async (req, res, next) => {
  try {
    const { offices } = req.body;

    if (!Array.isArray(offices)) {
      return ApiResponse.badRequest(res, 'offices must be an array');
    }

    if (mongoose.connection.readyState === 1) {
      const company = await getOrCreateCompany();
      company.offices = offices;
      await company.save();
      return ApiResponse.success(res, company.offices, 'Global offices updated successfully');
    }

    inMemoryCompany.offices = offices;
    return ApiResponse.success(res, inMemoryCompany.offices, 'Global offices updated (offline mode)');
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

/**
 * @desc    Update all FAQs
 * @route   PUT /api/company/faqs
 * @access  Private (Admin, Developer)
 */
export const updateFaqs = async (req, res, next) => {
  try {
    const { faqs } = req.body;

    if (!Array.isArray(faqs)) {
      return ApiResponse.badRequest(res, 'faqs must be an array');
    }

    if (mongoose.connection.readyState === 1) {
      const company = await getOrCreateCompany();
      company.faqs = faqs;
      await company.save();
      return ApiResponse.success(res, company.faqs, 'FAQs updated successfully');
    }

    inMemoryCompany.faqs = faqs;
    return ApiResponse.success(res, inMemoryCompany.faqs, 'FAQs updated (offline mode)');
  } catch (error) {
    next(error);
  }
};
