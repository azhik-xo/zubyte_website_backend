import mongoose from 'mongoose';
import { Inquiry } from '../models/Inquiry.js';
import { ApiResponse } from '../utils/apiResponse.js';
import {
  getAttachmentBucket,
  uploadBufferToGridFS,
  findGridFSFile,
  deleteFileFromGridFS,
} from '../config/gridfs.js';
import { sanitizeFilename } from '../utils/fileValidation.js';

// In-memory store fallback when DB is disconnected
let inMemoryInquiries = [];

/**
 * @desc    Submit a new contact inquiry (with optional file attachment stored in GridFS)
 * @route   POST /api/contact
 * @access  Public
 */
export const submitInquiry = async (req, res, next) => {
  try {
    const { firstName, lastName, email, company, message, serviceInterest } = req.body;

    let attachmentData = null;
    if (req.file && req.file.buffer) {
      if (mongoose.connection.readyState === 1) {
        try {
          const attachmentBucket = getAttachmentBucket();
          const safeFilename = sanitizeFilename(req.file.originalname);

          const fileId = await uploadBufferToGridFS(
            attachmentBucket,
            req.file.buffer,
            safeFilename,
            {
              contentType: req.file.mimetype,
              metadata: {
                originalName: req.file.originalname,
                sizeBytes: req.file.size,
                uploadedAt: new Date(),
              },
            }
          );

          attachmentData = {
            originalName: req.file.originalname,
            filename: safeFilename,
            mimeType: req.file.mimetype,
            sizeBytes: req.file.size,
            path: `/api/contact/attachment/${fileId}`,
          };
        } catch (uploadErr) {
          console.warn('[Attachment Upload Error]', uploadErr.message);
        }
      }

      // Memory fallback if DB offline
      if (!attachmentData) {
        attachmentData = {
          originalName: req.file.originalname,
          filename: req.file.originalname,
          mimeType: req.file.mimetype,
          sizeBytes: req.file.size,
          path: `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`,
        };
      }
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
 * @desc    Stream contact inquiry attachment from GridFS 'attachment_files' bucket
 * @route   GET /api/contact/attachment/:id
 * @access  Public
 */
export const getInquiryAttachment = async (req, res, next) => {
  try {
    const rawId = req.params.id;
    const cleanId = rawId.split('.')[0].trim();

    if (!mongoose.Types.ObjectId.isValid(cleanId)) {
      return ApiResponse.notFound(res, 'Attachment not found (invalid identifier)');
    }

    const objectId = new mongoose.Types.ObjectId(cleanId);
    const bucket = getAttachmentBucket();
    const file = await findGridFSFile(bucket, objectId);

    if (!file) {
      return ApiResponse.notFound(res, 'Attachment not found in storage');
    }

    const contentType = file.contentType || file.metadata?.contentType || 'application/octet-stream';
    const originalName = file.metadata?.originalName || file.filename || 'attachment';

    res.setHeader('Content-Type', contentType);
    if (file.length) {
      res.setHeader('Content-Length', file.length);
    }

    // PDFs and images display inline; other formats prompt download
    const isInline = contentType.includes('pdf') || contentType.startsWith('image/');
    res.setHeader(
      'Content-Disposition',
      `${isInline ? 'inline' : 'attachment'}; filename="${encodeURIComponent(originalName)}"`
    );
    res.setHeader('Cache-Control', 'private, max-age=86400');

    const downloadStream = bucket.openDownloadStream(file._id);

    downloadStream.on('error', (err) => {
      console.warn(`[GridFS Attachment Stream Error] ${file._id}:`, err.message);
      if (!res.headersSent) {
        return ApiResponse.error(res, 'Error streaming attachment', 500);
      }
      res.end();
    });

    downloadStream.pipe(res);
  } catch (error) {
    console.error('[Get Attachment Error]', error.message);
    if (!res.headersSent) {
      return ApiResponse.notFound(res, 'Attachment not found');
    }
    res.end();
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
 * @desc    Delete inquiry and purge its attachment from GridFS
 * @route   DELETE /api/contact/:id
 * @access  Private / Admin
 */
export const deleteInquiry = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const inquiry = await Inquiry.findById(req.params.id);
      if (!inquiry) return ApiResponse.notFound(res, 'Inquiry not found');

      const attachmentPath = inquiry.attachment?.path || '';

      // Purge from GridFS attachment_files bucket
      if (attachmentPath.includes('/api/contact/attachment/')) {
        const fileId = attachmentPath.split('/api/contact/attachment/')[1]?.split('?')[0];
        if (fileId && mongoose.Types.ObjectId.isValid(fileId)) {
          const bucket = getAttachmentBucket();
          await deleteFileFromGridFS(bucket, fileId);
        }
      }

      await Inquiry.findByIdAndDelete(req.params.id);
      return ApiResponse.success(res, null, 'Inquiry and attached assets deleted successfully');
    }

    inMemoryInquiries = inMemoryInquiries.filter((i) => i._id !== req.params.id);
    return ApiResponse.success(res, null, 'Inquiry deleted');
  } catch (error) {
    next(error);
  }
};
