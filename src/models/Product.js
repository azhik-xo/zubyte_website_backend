import mongoose from 'mongoose';

const productItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    type: {
      type: String,
      required: true,
      trim: true,
    },
    desc: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['Live', 'Beta', 'Coming Soon'],
      default: 'Live',
    },
    features: [{ type: String }],
  },
  { _id: true }
);

const productCategorySchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
    suite: {
      type: String,
      required: true,
      trim: true,
    },
    color: {
      type: String,
      default: '#6366f1',
    },
    tagline: {
      type: String,
      required: true,
      trim: true,
    },
    desc: {
      type: String,
      required: true,
      trim: true,
    },
    subcategories: [{ type: String }],
    img: {
      type: String,
      default: '',
    },
    products: [productItemSchema],
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

productCategorySchema.index({ id: 1, suite: 1 });

export const Product = mongoose.model('Product', productCategorySchema);

