import mongoose from 'mongoose';
import { Service } from '../models/Service.js';
import { SERVICES_SEED } from '../seeds/seedData.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { deleteFromCloudinary } from '../config/cloudinary.js';

let inMemoryServices = JSON.parse(JSON.stringify(SERVICES_SEED));

/**
 * @desc    Get all service discipline groups & their 21 service items
 * @route   GET /api/services
 * @access  Public
 */
export const getAllServices = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const services = await Service.find().sort({ order: 1, createdAt: 1 });
      const totalServicesCount = services.reduce(
        (acc, group) => acc + (group.items ? group.items.length : 0),
        0
      );

      return ApiResponse.success(res, services, 'Services retrieved successfully', 200, {
        totalGroups: services.length,
        totalServices: totalServicesCount,
      });
    }

    // Memory fallback
    const totalServicesCount = inMemoryServices.reduce(
      (acc, group) => acc + (group.items ? group.items.length : 0),
      0
    );

    return ApiResponse.success(res, inMemoryServices, 'Services retrieved (offline mode)', 200, {
      totalGroups: inMemoryServices.length,
      totalServices: totalServicesCount,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get services for a specific discipline slug
 * @route   GET /api/services/:slug
 * @access  Public
 */
export const getServiceBySlug = async (req, res, next) => {
  try {
    const slug = req.params.slug.toLowerCase();

    if (mongoose.connection.readyState === 1) {
      const serviceGroup = await Service.findOne({ slug });
      if (!serviceGroup) {
        return ApiResponse.notFound(res, `Service discipline '${slug}' not found`);
      }
      return ApiResponse.success(res, serviceGroup, 'Service discipline retrieved');
    }

    const serviceGroup = inMemoryServices.find((s) => s.slug === slug);
    if (!serviceGroup) {
      return ApiResponse.notFound(res, `Service discipline '${slug}' not found`);
    }
    return ApiResponse.success(res, serviceGroup, 'Service discipline retrieved');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new service discipline
 * @route   POST /api/services
 * @access  Private / Admin
 */
export const createServiceGroup = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const serviceGroup = await Service.create(req.body);
      return ApiResponse.created(res, serviceGroup, 'Service group created successfully');
    }

    const newGroup = { _id: `svc_${Date.now()}`, ...req.body };
    inMemoryServices.push(newGroup);
    return ApiResponse.created(res, newGroup, 'Service group created');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a service discipline
 * @route   PUT /api/services/:id
 * @access  Private / Admin
 */
export const updateServiceGroup = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const serviceGroup = await Service.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });
      if (!serviceGroup) return ApiResponse.notFound(res, 'Service group not found');
      return ApiResponse.success(res, serviceGroup, 'Service group updated successfully');
    }

    const index = inMemoryServices.findIndex((s) => s._id === req.params.id || s.slug === req.params.id);
    if (index === -1) {
      // If updating existing by matching group name
      const fallbackIdx = inMemoryServices.findIndex((s) => s.group === req.body.group);
      if (fallbackIdx !== -1) {
        inMemoryServices[fallbackIdx] = { ...inMemoryServices[fallbackIdx], ...req.body };
        return ApiResponse.success(res, inMemoryServices[fallbackIdx], 'Service group updated');
      }
      return ApiResponse.notFound(res, 'Service group not found');
    }

    inMemoryServices[index] = { ...inMemoryServices[index], ...req.body };
    return ApiResponse.success(res, inMemoryServices[index], 'Service group updated');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a service discipline
 * @route   DELETE /api/services/:id
 * @access  Private / Admin
 */
export const deleteServiceGroup = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const serviceGroup = await Service.findById(req.params.id);
      if (!serviceGroup) return ApiResponse.notFound(res, 'Service group not found');

      if (serviceGroup.img && serviceGroup.img.includes('res.cloudinary.com')) {
        await deleteFromCloudinary(serviceGroup.img, 'image');
      }

      await Service.findByIdAndDelete(req.params.id);
      return ApiResponse.success(res, null, 'Service group and Cloudinary asset deleted successfully');
    }

    const grp = inMemoryServices.find((s) => s._id === req.params.id || s.slug === req.params.id);
    if (grp?.img && grp.img.includes('res.cloudinary.com')) {
      await deleteFromCloudinary(grp.img, 'image');
    }

    inMemoryServices = inMemoryServices.filter((s) => s._id !== req.params.id && s.slug !== req.params.id);
    return ApiResponse.success(res, null, 'Service group deleted');
  } catch (error) {
    next(error);
  }
};

