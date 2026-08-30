import mongoose from 'mongoose';

const starItemSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      enum: ['Situation', 'Task', 'Action', 'Result'],
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

const caseStudySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Case study title is required'],
      trim: true,
    },
    service: {
      type: String,
      required: [true, 'Service name is required (e.g., Web Development, SEO)'],
      trim: true,
      index: true,
    },
    group: {
      type: String,
      enum: ['Build', 'Design', 'Grow', 'Deploy', 'Engineering'],
      required: true,
      index: true,
    },
    subcategory: {
      type: String,
      trim: true,
      default: '',
    },
    tags: [{ type: String, index: true }],
    img: {
      type: String,
      required: true,
    },
    shortDesc: {
      type: String,
      required: true,
    },
    stars: {
      type: [starItemSchema],
      validate: [
        (val) => val.length === 4,
        'Case study must have all 4 STAR framework points (Situation, Task, Action, Result)',
      ],
    },
    github: {
      type: String,
      default: 'https://github.com',
    },
    live: {
      type: String,
      default: 'https://zubyte.com',
    },
    featured: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

caseStudySchema.index({ service: 1, group: 1, tags: 1 });

export const CaseStudy = mongoose.model('CaseStudy', caseStudySchema);

