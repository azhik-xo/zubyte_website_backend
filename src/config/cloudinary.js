import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

// Check if Cloudinary credentials are provided and not placeholders
const isCloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET &&
  process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name' &&
  process.env.CLOUDINARY_CLOUD_NAME !== 'zubyte-cloud'
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  console.log('[Cloudinary] Connected to collection "zubyte_asset" on cloud:', process.env.CLOUDINARY_CLOUD_NAME);
} else {
  console.log('[Cloudinary] Running in local fallback mode (no Cloudinary credentials provided).');
}

/**
 * Extracts publicId from Cloudinary URL or returns identifier
 */
export const extractPublicId = (urlOrPublicId) => {
  if (!urlOrPublicId || typeof urlOrPublicId !== 'string') return null;

  if (urlOrPublicId.includes('res.cloudinary.com')) {
    try {
      // Matches /upload/(v1234/)?(zubyte_asset/filename)
      const regex = /\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-zA-Z0-9]+)?$/;
      const match = urlOrPublicId.match(regex);
      if (match && match[1]) {
        return match[1];
      }
    } catch {
      // ignore
    }
  }

  // If already public ID
  return urlOrPublicId.replace(/\.[^/.]+$/, '');
};

/**
 * Upload image or document buffer/filepath directly to Cloudinary folder 'zubyte_asset'
 * @param {Buffer|string} fileInput - Image or document buffer or file path
 * @param {string} folder - Destination folder in Cloudinary (defaults to 'zubyte_asset')
 * @param {string} resourceType - 'auto', 'image', or 'raw'
 * @returns {Promise<object>} Upload result
 */
export const uploadToCloudinary = (fileInput, folder = 'zubyte_asset', resourceType = 'auto') => {
  return new Promise((resolve, reject) => {
    if (!isCloudinaryConfigured) {
      return resolve({
        isMock: true,
        public_id: `zubyte_local_${Date.now()}`,
        secure_url: null,
      });
    }

    const uploadOptions = {
      folder,
      resource_type: resourceType,
      use_filename: true,
      unique_filename: true,
    };

    // If fileInput is a file path on disk
    if (typeof fileInput === 'string' && fs.existsSync(fileInput)) {
      cloudinary.uploader.upload(fileInput, uploadOptions, (error, result) => {
        if (error && resourceType === 'auto') {
          // Retry with raw
          return cloudinary.uploader.upload(
            fileInput,
            { ...uploadOptions, resource_type: 'raw' },
            (rawErr, rawResult) => {
              if (rawErr) return reject(rawErr);
              resolve(rawResult);
            }
          );
        }
        if (error) return reject(error);
        resolve(result);
      });
      return;
    }

    // If fileInput is a buffer
    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error && resourceType === 'auto') {
          // Retry buffer as raw stream
          const rawStream = cloudinary.uploader.upload_stream(
            { ...uploadOptions, resource_type: 'raw' },
            (rawErr, rawResult) => {
              if (rawErr) return reject(rawErr);
              resolve(rawResult);
            }
          );
          return rawStream.end(fileInput);
        }
        if (error) return reject(error);
        resolve(result);
      }
    );

    uploadStream.end(fileInput);
  });
};


/**
 * Delete asset from Cloudinary by public ID or Cloudinary URL (handles images, raw documents, and PDFs)
 * @param {string} urlOrPublicId
 * @param {string} resourceType - 'auto', 'image', or 'raw'
 */
export const deleteFromCloudinary = async (urlOrPublicId, resourceType = 'auto') => {
  if (!isCloudinaryConfigured || !urlOrPublicId) return { result: 'not_configured_or_empty' };

  const publicId = extractPublicId(urlOrPublicId);
  if (!publicId) return { result: 'invalid_id' };

  try {
    console.log(`[Cloudinary] Deleting asset from zubyte_asset: ${publicId}`);

    // 1. Try deleting as image
    let res = await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
    if (res && res.result === 'ok') return res;

    // 2. Try deleting as raw document
    res = await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
    if (res && res.result === 'ok') return res;

    // 3. If URL has extension, try raw with extension
    if (urlOrPublicId.includes('.')) {
      const parts = urlOrPublicId.split('/');
      const filenameWithExt = parts[parts.length - 1].split('?')[0];
      const publicIdWithExt = `zubyte_asset/${filenameWithExt}`;
      res = await cloudinary.uploader.destroy(publicIdWithExt, { resource_type: 'raw' });
      if (res && res.result === 'ok') return res;
    }

    return res || { result: 'not_found' };
  } catch (err) {
    console.warn(`[Cloudinary] Could not delete ${publicId}:`, err.message);
    return { result: 'error', error: err.message };
  }
};

export { cloudinary, isCloudinaryConfigured };
