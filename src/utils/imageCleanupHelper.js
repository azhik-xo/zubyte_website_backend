import mongoose from 'mongoose';
import { getImageBucket, deleteFileFromGridFS } from '../config/gridfs.js';
import { Image } from '../models/Image.js';
import { isImageReferenced } from './referenceChecker.js';

/**
 * Safely cleans up an image asset if it is not referenced anywhere else in the database
 * Supports MongoDB GridFS assets
 * @param {string} imageUrlOrId - The image URL or identifier
 * @returns {Promise<boolean>}
 */
export const cleanupImageIfUnused = async (imageUrlOrId) => {
  if (!imageUrlOrId || typeof imageUrlOrId !== 'string') return false;

  const trimmed = imageUrlOrId.trim();

  // 1. Check for MongoDB GridFS image (/api/images/:id or raw ObjectId)
  const isGridFs = trimmed.includes('/api/images/') || mongoose.Types.ObjectId.isValid(trimmed);

  if (isGridFs) {
    const rawId = trimmed.split('/api/images/')[1] || trimmed;
    const cleanId = rawId.split('.')[0].trim();

    if (mongoose.Types.ObjectId.isValid(cleanId)) {
      const objectId = new mongoose.Types.ObjectId(cleanId);
      const isReferenced = await isImageReferenced(cleanId);

      if (!isReferenced) {
        try {
          const imageDoc =
            (await Image.findById(objectId)) || (await Image.findOne({ fileId: objectId }));

          const bucket = getImageBucket();
          const fileId = imageDoc ? imageDoc.fileId : objectId;

          await deleteFileFromGridFS(bucket, fileId);

          if (imageDoc) {
            await Image.findByIdAndDelete(imageDoc._id);
          }

          console.log(`[ImageCleanup] Purged unreferenced GridFS image: ${cleanId}`);
          return true;
        } catch (err) {
          console.warn(`[ImageCleanup Error] Could not delete GridFS file ${cleanId}:`, err.message);
        }
      }
    }
    return false;
  }

  return false;
};
