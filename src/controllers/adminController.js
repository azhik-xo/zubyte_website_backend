import mongoose from 'mongoose';
import { Inquiry } from '../models/Inquiry.js';
import { Service } from '../models/Service.js';
import { Product } from '../models/Product.js';
import { CaseStudy } from '../models/CaseStudy.js';
import { DemoRequest } from '../models/DemoRequest.js';
import { Subscriber } from '../models/Subscriber.js';
import { ApiResponse } from '../utils/apiResponse.js';

/**
 * @desc    Get dashboard metrics & summary data
 * @route   GET /api/admin/stats
 * @access  Private (Admin & Developer)
 */
export const getDashboardStats = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return ApiResponse.success(
        res,
        {
          metrics: {
            totalInquiries: 0,
            newInquiries: 0,
            totalDisciplines: 5,
            totalServices: 21,
            totalProductSuites: 4,
            totalProducts: 5,
            totalCaseStudies: 21,
            totalDemos: 0,
            totalSubscribers: 0,
          },
          recentInquiries: [],
          disciplines: [
            { name: 'Build', slug: 'build', count: 5, color: '#F1681D' },
            { name: 'Design', slug: 'design', count: 4, color: '#ec4899' },
            { name: 'Grow', slug: 'grow', count: 4, color: '#10b981' },
            { name: 'Deploy', slug: 'deploy', count: 4, color: '#0ea5e9' },
            { name: 'Engineering', slug: 'engineering', count: 4, color: '#8b5cf6' },
          ],
          productSuites: [
            { suite: 'Zubyte Edu', id: 'edu', count: 2, color: '#6366f1' },
            { suite: 'Zubyte Business', id: 'business', count: 1, color: '#0ea5e9' },
            { suite: 'Zubyte Work', id: 'work', count: 1, color: '#10b981' },
            { suite: 'Zubyte Staff', id: 'staff', count: 1, color: '#f59e0b' },
          ],
        },
        'Dashboard stats retrieved (default catalog)'
      );
    }

    const [
      totalInquiries,
      newInquiries,
      services,
      products,
      totalCaseStudies,
      totalDemos,
      totalSubscribers,
      recentInquiries,
    ] = await Promise.all([
      Inquiry.countDocuments(),
      Inquiry.countDocuments({ status: 'new' }),
      Service.find(),
      Product.find(),
      CaseStudy.countDocuments(),
      DemoRequest.countDocuments(),
      Subscriber.countDocuments(),
      Inquiry.find().sort({ createdAt: -1 }).limit(6),
    ]);

    const totalIndividualServices = services.reduce(
      (sum, group) => sum + (group.items ? group.items.length : 0),
      0
    );

    const totalIndividualProducts = products.reduce(
      (sum, suite) => sum + (suite.products ? suite.products.length : 0),
      0
    );

    return ApiResponse.success(
      res,
      {
        metrics: {
          totalInquiries,
          newInquiries,
          totalDisciplines: services.length,
          totalServices: totalIndividualServices,
          totalProductSuites: products.length,
          totalProducts: totalIndividualProducts,
          totalCaseStudies,
          totalDemos,
          totalSubscribers,
        },
        recentInquiries,
        disciplines: services.map((s) => ({
          name: s.group,
          slug: s.slug,
          count: s.items?.length || 0,
          color: s.color,
        })),
        productSuites: products.map((p) => ({
          suite: p.suite,
          id: p.id,
          count: p.products?.length || 0,
          color: p.color,
        })),
      },
      'Dashboard stats retrieved'
    );
  } catch (error) {
    next(error);
  }
};
