import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { uploadToCloudinary, deleteFromCloudinary, isCloudinaryConfigured } from '../config/cloudinary.js';
import { ApiResponse } from '../utils/apiResponse.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * @desc    Upload an image to Cloudinary (with fallback to local storage)
 * @route   POST /api/upload/image
 * @access  Private (Admin & Developer)
 */
export const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return ApiResponse.badRequest(res, 'Please provide an image file to upload');
    }

    const folder = req.body.folder || 'zubyte_asset';

    if (isCloudinaryConfigured) {
      // Upload memory buffer directly to Cloudinary
      const result = await uploadToCloudinary(req.file.buffer, folder);

      return ApiResponse.created(
        res,
        {
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes,
          storage: 'cloudinary',
        },
        'Image uploaded successfully to Cloudinary'
      );
    } else {
      // Local disk fallback
      const uploadDir = path.join(__dirname, '../../uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const ext = path.extname(req.file.originalname).toLowerCase();
      const sanitizedBase = path
        .basename(req.file.originalname, ext)
        .replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `${sanitizedBase}-${Date.now()}${ext}`;
      const filePath = path.join(uploadDir, filename);

      fs.writeFileSync(filePath, req.file.buffer);

      const localUrl = `/uploads/${filename}`;

      return ApiResponse.created(
        res,
        {
          url: localUrl,
          publicId: filename,
          format: ext.replace('.', ''),
          bytes: req.file.size,
          storage: 'local',
        },
        'Image uploaded successfully (local storage)'
      );
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete an image from Cloudinary
 * @route   DELETE /api/upload/image/:publicId
 * @access  Private (Admin & Developer)
 */
export const deleteImage = async (req, res, next) => {
  try {
    const publicId = decodeURIComponent(req.params.publicId);

    if (isCloudinaryConfigured) {
      await deleteFromCloudinary(publicId);
    } else {
      const filePath = path.join(__dirname, '../../uploads', publicId);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    return ApiResponse.success(res, { publicId }, 'Image deleted successfully');
  } catch (error) {
    next(error);
  }
};

