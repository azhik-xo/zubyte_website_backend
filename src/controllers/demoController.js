import mongoose from 'mongoose';
import { DemoRequest } from '../models/DemoRequest.js';
import { Subscriber } from '../models/Subscriber.js';
import { ApiResponse } from '../utils/apiResponse.js';

let inMemoryDemos = [];
let inMemorySubscribers = [];

/**
 * @desc    Submit a product demo request
 * @route   POST /api/demo
 * @access  Public
 */
export const bookDemo = async (req, res, next) => {
  try {
    const { name, email, company, productSuite, teamSize, notes } = req.body;

    if (mongoose.connection.readyState === 1) {
      const demo = await DemoRequest.create({
        name,
        email,
        company,
        productSuite,
        teamSize,
        notes,
      });
      return ApiResponse.created(res, demo, 'Demo request submitted successfully');
    }

    const newDemo = {
      _id: `demo_${Date.now()}`,
      name,
      email,
      company,
      productSuite,
      teamSize,
      notes,
      status: 'pending',
      createdAt: new Date(),
    };
    inMemoryDemos.unshift(newDemo);
    return ApiResponse.created(res, newDemo, 'Demo request submitted');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all product demo requests
 * @route   GET /api/demo
 * @access  Private / Admin
 */
export const getDemoRequests = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const demos = await DemoRequest.find().sort({ createdAt: -1 });
      return ApiResponse.success(res, demos, 'Demo requests retrieved');
    }

    return ApiResponse.success(res, inMemoryDemos, 'Demo requests retrieved (offline mode)');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update demo status
 * @route   PATCH /api/demo/:id
 * @access  Private / Admin
 */
export const updateDemoStatus = async (req, res, next) => {
  try {
    const { status, notes } = req.body;

    if (mongoose.connection.readyState === 1) {
      const updateData = {};
      if (status) updateData.status = status;
      if (notes !== undefined) updateData.notes = notes;

      const demo = await DemoRequest.findByIdAndUpdate(req.params.id, updateData, {
        new: true,
        runValidators: true,
      });

      if (!demo) return ApiResponse.notFound(res, 'Demo request not found');
      return ApiResponse.success(res, demo, 'Demo request updated successfully');
    }

    const idx = inMemoryDemos.findIndex((d) => d._id === req.params.id);
    if (idx === -1) return ApiResponse.notFound(res, 'Demo request not found');
    if (status) inMemoryDemos[idx].status = status;
    if (notes !== undefined) inMemoryDemos[idx].notes = notes;

    return ApiResponse.success(res, inMemoryDemos[idx], 'Demo request updated');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete demo request
 * @route   DELETE /api/demo/:id
 * @access  Private / Admin
 */
export const deleteDemo = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const demo = await DemoRequest.findByIdAndDelete(req.params.id);
      if (!demo) return ApiResponse.notFound(res, 'Demo request not found');
      return ApiResponse.success(res, null, 'Demo request deleted successfully');
    }

    inMemoryDemos = inMemoryDemos.filter((d) => d._id !== req.params.id);
    return ApiResponse.success(res, null, 'Demo request deleted');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Subscribe to newsletter
 * @route   POST /api/newsletter
 * @access  Public
 */
export const subscribeNewsletter = async (req, res, next) => {
  try {
    const { email, source } = req.body;

    if (mongoose.connection.readyState === 1) {
      const subscriber = await Subscriber.create({ email, source: source || 'website_footer' });
      return ApiResponse.created(res, subscriber, 'Thank you for subscribing to Zubyte updates!');
    }

    const newSub = {
      _id: `sub_${Date.now()}`,
      email,
      source: source || 'website_footer',
      createdAt: new Date(),
    };
    inMemorySubscribers.push(newSub);
    return ApiResponse.created(res, newSub, 'Thank you for subscribing to Zubyte updates!');
  } catch (error) {
    if (error.code === 11000) {
      return ApiResponse.error(res, 'You are already subscribed to our updates.', 409);
    }
    next(error);
  }
};

/**
 * @desc    Get all newsletter subscribers
 * @route   GET /api/newsletter
 * @access  Private / Admin
 */
export const getSubscribers = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const subscribers = await Subscriber.find().sort({ createdAt: -1 });
      return ApiResponse.success(res, subscribers, 'Subscribers retrieved');
    }

    return ApiResponse.success(res, inMemorySubscribers, 'Subscribers retrieved (offline mode)');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete subscriber
 * @route   DELETE /api/newsletter/:id
 * @access  Private / Admin
 */
export const deleteSubscriber = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const subscriber = await Subscriber.findByIdAndDelete(req.params.id);
      if (!subscriber) return ApiResponse.notFound(res, 'Subscriber not found');
      return ApiResponse.success(res, null, 'Subscriber removed successfully');
    }

    inMemorySubscribers = inMemorySubscribers.filter((s) => s._id !== req.params.id);
    return ApiResponse.success(res, null, 'Subscriber removed');
  } catch (error) {
    next(error);
  }
};

export const requestDemo = bookDemo;
export const getAllDemoRequests = getDemoRequests;


