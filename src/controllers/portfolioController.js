import mongoose from 'mongoose';
import { CaseStudy } from '../models/CaseStudy.js';
import { CASE_STUDIES_SEED } from '../seeds/seedData.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { deleteFromCloudinary } from '../config/cloudinary.js';

let inMemoryPortfolio = JSON.parse(JSON.stringify(CASE_STUDIES_SEED));

/**
 * @desc    Get all portfolio case studies with group/service filters and search
 * @route   GET /api/portfolio
 * @access  Public
 */
export const getAllCaseStudies = async (req, res, next) => {
  try {
    const { group, service, subcategory, search } = req.query;

    if (mongoose.connection.readyState === 1) {
      const query = {};
      if (group && group !== 'All') query.group = group;
      if (service && service !== 'All') query.service = service;
      if (subcategory && subcategory !== 'All') query.subcategory = subcategory;
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { shortDesc: { $regex: search, $options: 'i' } },
          { tags: { $in: [new RegExp(search, 'i')] } },
        ];
      }

      const caseStudies = await CaseStudy.find(query).sort({ createdAt: -1 });
      return ApiResponse.success(res, caseStudies, 'Case studies retrieved successfully', 200, {
        total: caseStudies.length,
      });
    }

    // Memory fallback
    let filtered = [...inMemoryPortfolio];
    if (group && group !== 'All') {
      filtered = filtered.filter((p) => p.group === group);
    }
    if (service && service !== 'All') {
      filtered = filtered.filter((p) => p.service === service);
    }
    if (subcategory && subcategory !== 'All') {
      filtered = filtered.filter((p) => p.subcategory === subcategory);
    }
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.title?.toLowerCase().includes(s) ||
          p.shortDesc?.toLowerCase().includes(s) ||
          p.tags?.some((t) => t.toLowerCase().includes(s))
      );
    }

    return ApiResponse.success(res, filtered, 'Case studies retrieved (offline mode)', 200, {
      total: filtered.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single case study by ID
 * @route   GET /api/portfolio/:id
 * @access  Public
 */
export const getCaseStudyById = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const caseStudy = await CaseStudy.findById(req.params.id);
      if (!caseStudy) return ApiResponse.notFound(res, 'Case study not found');
      return ApiResponse.success(res, caseStudy, 'Case study retrieved');
    }

    const caseStudy = inMemoryPortfolio.find(
      (p) => p._id === req.params.id || p.title === req.params.id
    );
    if (!caseStudy) return ApiResponse.notFound(res, 'Case study not found');
    return ApiResponse.success(res, caseStudy, 'Case study retrieved');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new case study
 * @route   POST /api/portfolio
 * @access  Private (Admin & Developer)
 */
export const createCaseStudy = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const caseStudy = await CaseStudy.create(req.body);
      return ApiResponse.created(res, caseStudy, 'Case study created successfully');
    }

    const newCase = {
      _id: `cs_${Date.now()}`,
      ...req.body,
      createdAt: new Date(),
    };
    inMemoryPortfolio.unshift(newCase);
    return ApiResponse.created(res, newCase, 'Case study created');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update case study
 * @route   PUT /api/portfolio/:id
 * @access  Private (Admin & Developer)
 */
export const updateCaseStudy = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const caseStudy = await CaseStudy.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });
      if (!caseStudy) return ApiResponse.notFound(res, 'Case study not found');
      return ApiResponse.success(res, caseStudy, 'Case study updated successfully');
    }

    const index = inMemoryPortfolio.findIndex(
      (p) => p._id === req.params.id || p.title === req.params.id
    );
    if (index === -1) return ApiResponse.notFound(res, 'Case study not found');

    inMemoryPortfolio[index] = { ...inMemoryPortfolio[index], ...req.body };
    return ApiResponse.success(res, inMemoryPortfolio[index], 'Case study updated');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete case study
 * @route   DELETE /api/portfolio/:id
 * @access  Private (Admin & Developer)
 */
export const deleteCaseStudy = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const caseStudy = await CaseStudy.findById(req.params.id);
      if (!caseStudy) return ApiResponse.notFound(res, 'Case study not found');

      // Delete image from Cloudinary if hosted there
      if (caseStudy.img && caseStudy.img.includes('res.cloudinary.com')) {
        await deleteFromCloudinary(caseStudy.img, 'image');
      }

      await CaseStudy.findByIdAndDelete(req.params.id);
      return ApiResponse.success(res, null, 'Case study and Cloudinary asset deleted successfully');
    }

    const proj = inMemoryPortfolio.find(
      (p) => p._id === req.params.id || p.title === req.params.id
    );
    if (proj?.img && proj.img.includes('res.cloudinary.com')) {
      await deleteFromCloudinary(proj.img, 'image');
    }

    inMemoryPortfolio = inMemoryPortfolio.filter((p) => p._id !== req.params.id && p.title !== req.params.id);
    return ApiResponse.success(res, null, 'Case study deleted');
  } catch (error) {
    next(error);
  }
};


export const getCaseStudies = getAllCaseStudies;


