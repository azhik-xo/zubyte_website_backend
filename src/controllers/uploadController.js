import mongoose from 'mongoose';
import { getImageBucket, uploadBufferToGridFS, deleteFileFromGridFS } from '../config/gridfs.js';
import { Image } from '../models/Image.js';
import { validateImageFile, sanitizeFilename } from '../utils/fileValidation.js';
import { isImageReferenced } from '../utils/referenceChecker.js';
import { ApiResponse } from '../utils/apiResponse.js';

/**
 * @desc    Upload an image directly to MongoDB GridFS with validation
 * @route   POST /api/upload/image
 * @access  Private (Admin & Developer)
 */
export const uploadImage = async (req, res, next) => {
  try {
    if (!req.file || !req.file.buffer) {
      return ApiResponse.badRequest(res, 'Please provide an image file to upload');
    }

    const maxBytes = parseInt(process.env.MAX_FILE_SIZE_MB || '10', 10) * 1024 * 1024;
    const validation = validateImageFile(req.file.buffer, req.file.originalname, maxBytes);

    if (!validation.valid) {
      return ApiResponse.badRequest(res, validation.error);
    }

    const safeFilename = sanitizeFilename(req.file.originalname);
    const bucket = getImageBucket();

    // 1. Upload binary stream to MongoDB GridFS 'image_files'
    const fileId = await uploadBufferToGridFS(bucket, req.file.buffer, safeFilename, {
      contentType: validation.contentType,
      metadata: {
        originalName: req.file.originalname,
        uploadedBy: req.user ? req.user._id : null,
      },
    });

    // 2. Create rich Image metadata record in MongoDB
    const imageDoc = await Image.create({
      filename: safeFilename,
      originalName: req.file.originalname,
      contentType: validation.contentType,
      size: req.file.size || req.file.buffer.length,
      fileId,
      alt: req.body.alt || '',
    });

    const imageUrl = `/api/images/${imageDoc._id}`;

    return ApiResponse.created(
      res,
      {
        id: imageDoc._id,
        imageId: imageDoc._id,
        url: imageUrl,
        fileId: imageDoc.fileId,
        filename: imageDoc.filename,
        originalName: imageDoc.originalName,
        contentType: imageDoc.contentType,
        size: imageDoc.size,
        storage: 'gridfs',
      },
      'Image uploaded successfully to MongoDB GridFS'
    );
  } catch (error) {
    console.error('[Upload Image Error]', error.message);
    next(error);
  }
};

/**
 * @desc    Delete an image from MongoDB GridFS
 * @route   DELETE /api/upload/image/:publicId
 * @access  Private (Admin & Developer)
 */
export const deleteImage = async (req, res, next) => {
  try {
    const rawParam = decodeURIComponent(req.params.publicId || '');
    if (!rawParam) {
      return ApiResponse.badRequest(res, 'Image identifier is required');
    }

    // Check if parameter is or contains a 24-character hexadecimal ObjectId
    const cleanId = rawParam.split('.')[0].replace(/^\/api\/images\//, '').trim();

    if (mongoose.Types.ObjectId.isValid(cleanId)) {
      const objectId = new mongoose.Types.ObjectId(cleanId);
      const imageDoc =
        (await Image.findById(objectId)) || (await Image.findOne({ fileId: objectId }));

      const force = req.query.force === 'true';
      if (imageDoc && !force) {
        const referenced = await isImageReferenced(imageDoc._id);
        if (referenced) {
          return ApiResponse.badRequest(
            res,
            'Cannot delete image: it is currently referenced by active website content'
          );
        }
      }

      const bucket = getImageBucket();
      const fileId = imageDoc ? imageDoc.fileId : objectId;
      await deleteFileFromGridFS(bucket, fileId);

      if (imageDoc) {
        await Image.findByIdAndDelete(imageDoc._id);
      }

      return ApiResponse.success(res, { id: cleanId }, 'Image deleted successfully from MongoDB GridFS');
    }

    return ApiResponse.badRequest(res, 'Invalid image identifier');
  } catch (error) {
    next(error);
  }
};
