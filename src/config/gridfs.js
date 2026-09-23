import mongoose from 'mongoose';
import { Readable } from 'stream';

/**
 * GridFS Bucket Names
 * - image_files: Website, portfolio, products, services, client logos
 * - attachment_files: Contact form inquiries, resumes, documents
 */
export const IMAGE_BUCKET_NAME = 'image_files';
export const ATTACHMENT_BUCKET_NAME = 'attachment_files';

/**
 * Get the GridFS Bucket for images
 * @returns {mongoose.mongo.GridFSBucket}
 */
export const getImageBucket = () => {
  if (!mongoose.connection.db) {
    throw new Error('Database connection is not ready for GridFS operations');
  }
  return new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: IMAGE_BUCKET_NAME,
  });
};

/**
 * Get the GridFS Bucket for contact form attachments
 * @returns {mongoose.mongo.GridFSBucket}
 */
export const getAttachmentBucket = () => {
  if (!mongoose.connection.db) {
    throw new Error('Database connection is not ready for GridFS operations');
  }
  return new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: ATTACHMENT_BUCKET_NAME,
  });
};

/**
 * Upload a Buffer to a specified GridFS Bucket
 * @param {mongoose.mongo.GridFSBucket} bucket - GridFSBucket instance
 * @param {Buffer} buffer - File data buffer
 * @param {string} filename - Unique sanitized filename
 * @param {object} options - Options including contentType and metadata
 * @returns {Promise<mongoose.Types.ObjectId>} - GridFS file _id
 */
export const uploadBufferToGridFS = (bucket, buffer, filename, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadStream = bucket.openUploadStream(filename, {
      contentType: options.contentType || 'application/octet-stream',
      metadata: options.metadata || {},
    });

    const readable = Readable.from(buffer);

    readable.pipe(uploadStream)
      .on('finish', () => resolve(uploadStream.id))
      .on('error', (err) => reject(err));
  });
};

/**
 * Find GridFS file document by ObjectId
 * @param {mongoose.mongo.GridFSBucket} bucket
 * @param {string|mongoose.Types.ObjectId} fileId
 * @returns {Promise<object|null>}
 */
export const findGridFSFile = async (bucket, fileId) => {
  const objectId = typeof fileId === 'string' ? new mongoose.Types.ObjectId(fileId) : fileId;
  const files = await bucket.find({ _id: objectId }).limit(1).toArray();
  return files.length > 0 ? files[0] : null;
};

/**
 * Delete a file from a GridFS bucket
 * @param {mongoose.mongo.GridFSBucket} bucket
 * @param {string|mongoose.Types.ObjectId} fileId
 * @returns {Promise<boolean>}
 */
export const deleteFileFromGridFS = async (bucket, fileId) => {
  try {
    const objectId = typeof fileId === 'string' ? new mongoose.Types.ObjectId(fileId) : fileId;
    const exists = await findGridFSFile(bucket, objectId);
    if (!exists) return false;
    await bucket.delete(objectId);
    return true;
  } catch (err) {
    console.warn(`[GridFS] Error deleting file ${fileId}:`, err.message);
    return false;
  }
};

