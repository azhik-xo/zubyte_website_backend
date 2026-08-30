import mongoose from 'mongoose';

const serviceItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Service item name is required'],
      trim: true,
    },
    desc: {
      type: String,
      required: [true, 'Service description is required'],
      trim: true,
    },
    icon: {
      type: String,
      default: '',
    },
  },
  { _id: true }
);

const serviceGroupSchema = new mongoose.Schema(
  {
    group: {
      type: String,
      required: [true, 'Discipline group name is required (e.g., Build, Design)'],
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    portfolioKey: {
      type: String,
      required: true,
      trim: true,
    },
    icon: {
      type: String,
      default: '⬡',
    },
    color: {
      type: String,
      default: '#1b1b1b',
    },
    tagline: {
      type: String,
      required: true,
      trim: true,
    },
    img: {
      type: String,
      default: '',
    },
    items: [serviceItemSchema],
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

serviceGroupSchema.index({ slug: 1, group: 1 });

export const Service = mongoose.model('Service', serviceGroupSchema);

