import mongoose from 'mongoose';

const demoRequestSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Contact name is required'],
      trim: true,
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
    },
    productSuite: {
      type: String,
      enum: ['Zubyte Edu', 'Zubyte Business', 'Zubyte Work', 'Zubyte Staff', 'All Suites'],
      default: 'All Suites',
    },
    teamSize: {
      type: String,
      enum: ['1-10', '11-50', '51-200', '201-1000', '1000+'],
      default: '11-50',
    },
    notes: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled', 'pending'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

export const DemoRequest = mongoose.model('DemoRequest', demoRequestSchema);

