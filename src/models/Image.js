import mongoose from 'mongoose';

/**
 * Image Metadata Schema
 * Represents an uploaded image asset stored persistently in MongoDB GridFS.
 */
const imageSchema = new mongoose.Schema(
  {
    filename: {
      type: String,
      required: [true, 'Filename is required'],
      trim: true,
      index: true,
    },
    originalName: {
      type: String,
      required: [true, 'Original filename is required'],
      trim: true,
    },
    contentType: {
      type: String,
      required: [true, 'Content type (MIME) is required'],
      trim: true,
      lowercase: true,
    },
    size: {
      type: Number,
      required: [true, 'File size in bytes is required'],
      min: 0,
    },
    fileId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'GridFS file reference (fileId) is required'],
      unique: true,
      index: true,
    },
    alt: {
      type: String,
      default: '',
      trim: true,
    },
    width: {
      type: Number,
      default: null,
    },
    height: {
      type: Number,
      default: null,
    },
    sourceUrl: {
      type: String,
      default: null,
      trim: true,
      index: true, // For migration deduplication lookups
    },
  },
  {
    timestamps: true,
  }
);

imageSchema.index({ createdAt: -1 });

export const Image = mongoose.model('Image', imageSchema);

