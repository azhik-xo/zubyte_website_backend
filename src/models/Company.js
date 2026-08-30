import mongoose from 'mongoose';

const companySchema = new mongoose.Schema(
  {
    name: { type: String, default: 'Zubyte Solution' },
    legalName: { type: String, default: 'Zubyte IT Solutions Inc.' },
    tagline: { type: String, default: 'Where Ideas Evolve Into Products' },
    description: { type: String, required: true },
    email: { type: String, default: 'hello@zubyte.com' },
    phone: { type: String, default: '+1 (800) 555-0199' },
    stats: [
      {
        stat: String,
        label: String,
        sub: String,
      },
    ],
    leadership: {
      name: String,
      role: String,
      quote: String,
    },
    offices: [
      {
        city: String,
        role: String,
        address: String,
      },
    ],
    faqs: [
      {
        q: String,
        a: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const Company = mongoose.model('Company', companySchema);

