import mongoose from 'mongoose';
import { Inquiry } from '../models/Inquiry.js';
import { ApiResponse } from '../utils/apiResponse.js';
import {
  uploadToCloudinary,
  deleteFromCloudinary,
  isCloudinaryConfigured,
} from '../config/cloudinary.js';

// In-memory store fallback when DB is disconnected
let inMemoryInquiries = [];

/**
 * @desc    Submit a new contact inquiry (with optional file attachment)
 * @route   POST /api/contact
 * @access  Public
 */
export const submitInquiry = async (req, res, next) => {
  try {
    const { firstName, lastName, email, company, message, serviceInterest } = req.body;

    let attachmentData = null;
    if (req.file) {
      let fileUrl = `/uploads/${req.file.filename}`;
      let publicId = req.file.filename;

      if (isCloudinaryConfigured) {
        try {
          const fileData = req.file.buffer || req.file.path;
          const cloudResult = await uploadToCloudinary(fileData, 'zubyte_asset', 'auto');
          if (cloudResult && cloudResult.secure_url) {
            fileUrl = cloudResult.secure_url;
            publicId = cloudResult.public_id;
          }
        } catch (uploadErr) {
          console.warn('[Cloudinary Notice] Attachment upload fallback to local storage:', uploadErr.message);
        }
      }

      attachmentData = {
        originalName: req.file.originalname,
        filename: publicId || req.file.filename,
        mimeType: req.file.mimetype,
        sizeBytes: req.file.size,
        path: fileUrl,
      };
    }


    if (mongoose.connection.readyState === 1) {
      const inquiry = await Inquiry.create({
        firstName,
        lastName,
        email,
        company: company || '',
        message,
        serviceInterest: serviceInterest || 'General Inquiry',
        attachment: attachmentData,
        ipAddress: req.ip || req.headers['x-forwarded-for'] || '',
      });

      return ApiResponse.created(
        res,
        {
          id: inquiry._id,
          firstName: inquiry.firstName,
          lastName: inquiry.lastName,
          email: inquiry.email,
          createdAt: inquiry.createdAt,
        },
        'Thank you for reaching out. We have received your inquiry and will be in touch within 24-48 hours.'
      );
    }

    // Memory fallback
    const newInquiry = {
      _id: `inq_${Date.now()}`,
      firstName,
      lastName,
      email,
      company: company || '',
      message,
      serviceInterest: serviceInterest || 'General Inquiry',
      attachment: attachmentData,
      status: 'new',
      createdAt: new Date(),
    };
    inMemoryInquiries.unshift(newInquiry);

    return ApiResponse.created(
      res,
      {
        id: newInquiry._id,
        firstName: newInquiry.firstName,
        lastName: newInquiry.lastName,
        email: newInquiry.email,
        createdAt: newInquiry.createdAt,
      },
      'Thank you for reaching out. We have received your inquiry and will be in touch within 24-48 hours.'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all inquiries with optional status filtering & pagination
 * @route   GET /api/contact
 * @access  Private / Admin
 */
export const getInquiries = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20, search } = req.query;

    if (mongoose.connection.readyState === 1) {
      const query = {};
      if (status && status !== 'all') {
        query.status = status;
      }
      if (search) {
        query.$or = [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { company: { $regex: search, $options: 'i' } },
        ];
      }

      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);
      const skip = (pageNum - 1) * limitNum;

      const [inquiries, total] = await Promise.all([
        Inquiry.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
        Inquiry.countDocuments(query),
      ]);

      return ApiResponse.success(res, inquiries, 'Inquiries retrieved successfully', 200, {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      });
    }

    // Memory fallback
    let filtered = [...inMemoryInquiries];
    if (status && status !== 'all') {
      filtered = filtered.filter((i) => i.status === status);
    }
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(
        (i) =>
          i.firstName?.toLowerCase().includes(s) ||
          i.lastName?.toLowerCase().includes(s) ||
          i.email?.toLowerCase().includes(s) ||
          i.company?.toLowerCase().includes(s)
      );
    }

    return ApiResponse.success(res, filtered, 'Inquiries retrieved (offline mode)', 200, {
      total: filtered.length,
      page: 1,
      limit: 20,
      totalPages: 1,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single inquiry details by ID
 * @route   GET /api/contact/:id
 * @access  Private / Admin
 */
export const getInquiryById = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const inquiry = await Inquiry.findById(req.params.id);
      if (!inquiry) {
        return ApiResponse.notFound(res, 'Inquiry not found');
      }
      return ApiResponse.success(res, inquiry, 'Inquiry details retrieved');
    }

    const item = inMemoryInquiries.find((i) => i._id === req.params.id);
    if (!item) return ApiResponse.notFound(res, 'Inquiry not found');
    return ApiResponse.success(res, item, 'Inquiry details retrieved');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update inquiry status or internal notes
 * @route   PATCH /api/contact/:id
 * @access  Private / Admin
 */
export const updateInquiryStatus = async (req, res, next) => {
  try {
    const { status, internalNotes } = req.body;

    if (mongoose.connection.readyState === 1) {
      const updateData = {};
      if (status) {
        updateData.status = status;
        if (status === 'contacted') {
          updateData.contactedAt = new Date();
        } else {
          updateData.contactedAt = null;
        }
      }
      if (internalNotes !== undefined) updateData.internalNotes = internalNotes;

      const inquiry = await Inquiry.findByIdAndUpdate(req.params.id, updateData, {
        new: true,
        runValidators: true,
      });

      if (!inquiry) {
        return ApiResponse.notFound(res, 'Inquiry not found');
      }

      return ApiResponse.success(
        res,
        inquiry,
        status === 'contacted'
          ? 'Inquiry marked as contacted. It will automatically be deleted in 24 hours.'
          : 'Inquiry updated successfully'
      );
    }

    // Memory fallback
    const index = inMemoryInquiries.findIndex((i) => i._id === req.params.id);
    if (index === -1) return ApiResponse.notFound(res, 'Inquiry not found');

    if (status) {
      inMemoryInquiries[index].status = status;
      inMemoryInquiries[index].contactedAt = status === 'contacted' ? new Date() : null;
    }
    if (internalNotes !== undefined) inMemoryInquiries[index].internalNotes = internalNotes;

    return ApiResponse.success(
      res,
      inMemoryInquiries[index],
      status === 'contacted'
        ? 'Inquiry marked as contacted. It will automatically be deleted in 24 hours.'
        : 'Inquiry updated'
    );

  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete inquiry
 * @route   DELETE /api/contact/:id
 * @access  Private / Admin
 */
export const deleteInquiry = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const inquiry = await Inquiry.findById(req.params.id);
      if (!inquiry) return ApiResponse.notFound(res, 'Inquiry not found');

      // Delete attached file from Cloudinary if present
      if (inquiry.attachment?.path && inquiry.attachment.path.includes('res.cloudinary.com')) {
        await deleteFromCloudinary(inquiry.attachment.path, 'auto');
      }

      await Inquiry.findByIdAndDelete(req.params.id);
      return ApiResponse.success(res, null, 'Inquiry and attached assets deleted successfully');
    }

    const inq = inMemoryInquiries.find((i) => i._id === req.params.id);
    if (inq?.attachment?.path && inq.attachment.path.includes('res.cloudinary.com')) {
      await deleteFromCloudinary(inq.attachment.path, 'auto');
    }

    inMemoryInquiries = inMemoryInquiries.filter((i) => i._id !== req.params.id);
    return ApiResponse.success(res, null, 'Inquiry deleted');
  } catch (error) {
    next(error);
  }
};

