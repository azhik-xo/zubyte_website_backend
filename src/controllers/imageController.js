import mongoose from 'mongoose';
import { getImageBucket, findGridFSFile, deleteFileFromGridFS } from '../config/gridfs.js';
import { Image } from '../models/Image.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { isImageReferenced } from '../utils/referenceChecker.js';

/**
 * Clean and extract a 24-character hexadecimal ObjectId from parameter
 * Strips any appended file extensions (e.g. '6a9496...png' -> '6a9496...')
 * @param {string} rawId
 * @returns {string|null}
 */
const extractCleanObjectId = (rawId) => {
  if (!rawId || typeof rawId !== 'string') return null;
  const cleaned = rawId.split('.')[0].trim();
  return mongoose.Types.ObjectId.isValid(cleaned) ? cleaned : null;
};

/**
 * @desc    Stream image file directly from MongoDB GridFS
 * @route   GET /api/images/:id
 * @access  Public
 */
export const getImage = async (req, res, next) => {
  try {
    const rawId = req.params.id;
    const cleanId = extractCleanObjectId(rawId);

    if (!cleanId) {
      return ApiResponse.notFound(res, 'Image not found (invalid identifier)');
    }

    const objectId = new mongoose.Types.ObjectId(cleanId);
    const bucket = getImageBucket();

    // 1. Try to find Image metadata document first
    let imageDoc = await Image.findById(objectId).lean();
    let fileId = objectId;

    if (imageDoc) {
      fileId = imageDoc.fileId;
    } else {
      // Check if the parameter itself is the GridFS fileId
      imageDoc = await Image.findOne({ fileId: objectId }).lean();
    }

    // 2. Locate the physical GridFS file
    const gridFile = await findGridFSFile(bucket, fileId);

    if (!gridFile) {
      return ApiResponse.notFound(res, 'Image file not found in storage');
    }

    const contentType =
      imageDoc?.contentType ||
      gridFile.contentType ||
      gridFile.metadata?.contentType ||
      'image/jpeg';

    const fileSize = imageDoc?.size || gridFile.length;
    const etag = `"${gridFile._id}-${gridFile.length}"`;

    // 3. Conditional GET support (HTTP 304 Not Modified)
    if (req.headers['if-none-match'] === etag) {
      return res.status(304).end();
    }

    // 4. Set caching and response headers
    res.setHeader('Content-Type', contentType);
    if (fileSize) {
      res.setHeader('Content-Length', fileSize);
    }
    res.setHeader('ETag', etag);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('Accept-Ranges', 'none');

    // 5. Stream from GridFS
    const downloadStream = bucket.openDownloadStream(gridFile._id);

    downloadStream.on('error', (streamErr) => {
      console.warn(`[GridFS Stream Error] ${gridFile._id}:`, streamErr.message);
      if (!res.headersSent) {
        return ApiResponse.error(res, 'Error streaming image from storage', 500);
      }
      res.end();
    });

    downloadStream.pipe(res);
  } catch (error) {
    console.error('[Get Image Controller Error]', error.message);
    if (!res.headersSent) {
      return ApiResponse.notFound(res, 'Image not found');
    }
    res.end();
  }
};

/**
 * @desc    Get Image Metadata info
 * @route   GET /api/images/:id/info
 * @access  Public
 */
export const getImageMetadata = async (req, res, next) => {
  try {
    const cleanId = extractCleanObjectId(req.params.id);
    if (!cleanId) return ApiResponse.notFound(res, 'Image not found');

    const objectId = new mongoose.Types.ObjectId(cleanId);
    let imageDoc = await Image.findById(objectId).lean();

    if (!imageDoc) {
      imageDoc = await Image.findOne({ fileId: objectId }).lean();
    }

    if (!imageDoc) {
      return ApiResponse.notFound(res, 'Image metadata not found');
    }

    return ApiResponse.success(res, {
      id: imageDoc._id,
      filename: imageDoc.filename,
      originalName: imageDoc.originalName,
      contentType: imageDoc.contentType,
      size: imageDoc.size,
      url: `/api/images/${imageDoc._id}`,
      alt: imageDoc.alt,
      width: imageDoc.width,
      height: imageDoc.height,
      createdAt: imageDoc.createdAt,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete an image from GridFS and Image metadata
 * @route   DELETE /api/images/:id
 * @access  Private (Admin & Developer)
 */
export const deleteImage = async (req, res, next) => {
  try {
    const cleanId = extractCleanObjectId(req.params.id);
    if (!cleanId) return ApiResponse.badRequest(res, 'Invalid image ID format');

    const objectId = new mongoose.Types.ObjectId(cleanId);
    let imageDoc = await Image.findById(objectId);

    if (!imageDoc) {
      imageDoc = await Image.findOne({ fileId: objectId });
    }

    const force = req.query.force === 'true';

    // Verify whether image is referenced in any collection before deletion
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

    return ApiResponse.success(
      res,
      { id: cleanId },
      'Image deleted successfully from MongoDB GridFS'
    );
  } catch (error) {
    next(error);
  }
};

