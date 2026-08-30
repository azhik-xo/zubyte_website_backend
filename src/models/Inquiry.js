import mongoose from 'mongoose';

const attachmentSchema = new mongoose.Schema(
  {
    originalName: { type: String, required: true },
    filename: { type: String, required: true },
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
    path: { type: String, required: true },
  },
  { _id: false }
);

const inquirySchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxlength: [100, 'First name cannot exceed 100 characters'],
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      maxlength: [100, 'Last name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email address'],
    },
    company: {
      type: String,
      trim: true,
      default: '',
      maxlength: [150, 'Company name cannot exceed 150 characters'],
    },
    message: {
      type: String,
      required: [true, 'Message / brief is required'],
      trim: true,
      maxlength: [5000, 'Message cannot exceed 5000 characters'],
    },
    serviceInterest: {
      type: String,
      trim: true,
      default: 'General Inquiry',
    },
    attachment: {
      type: attachmentSchema,
      default: null,
    },
    status: {
      type: String,
      enum: ['new', 'in_review', 'contacted', 'archived'],
      default: 'new',
      index: true,
    },
    contactedAt: {
      type: Date,
      default: null,
    },
    internalNotes: {
      type: String,
      default: '',
    },
    ipAddress: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Search indexing
inquirySchema.index({ email: 1, createdAt: -1 });

// TTL Index: Automatically delete inquiry documents 24 hours (86,400s) after being marked 'contacted'
inquirySchema.index({ contactedAt: 1 }, { expireAfterSeconds: 86400 });

export const Inquiry = mongoose.model('Inquiry', inquirySchema);
