import mongoose from 'mongoose';

const companySchema = new mongoose.Schema(
  {
    name: { type: String, default: 'Zubyte Solution' },
    legalName: { type: String, default: 'Zubyte IT Solutions Inc.' },
    shortName: { type: String, default: 'Zubyte' },
    tagline: { type: String, default: 'Where Ideas Evolve Into Products' },
    description: {
      type: String,
      default:
        'End-to-end technology partner for companies that want to build, grow and operate with confidence. We engineer bespoke software, intelligent systems, and scalable product platforms.',
    },
    email: { type: String, default: 'hello@zubyte.org' },
    phone: { type: String, default: '+1 (800) 555-0199' },
    foundedYear: { type: String, default: '2025' },
    leadership: {
      name: { type: String, default: 'Dinesh Murugan' },
      role: { type: String, default: 'CEO, ZuByte Solution' },
      initials: { type: String, default: 'DM' },
      quote: {
        type: String,
        default:
          'Zubyte was built with the desire to liberate creative teams from menial tasks, allowing them to focus on true strategic innovation.',
      },
    },
    stats: [
      {
        stat: String,
        label: String,
        sub: String,
      },
    ],
    clientLogos: [
      {
        name: { type: String, required: true },
        logoUrl: { type: String, default: '' },
        order: { type: Number, default: 0 },
        active: { type: Boolean, default: true },
      },
    ],
    coreValues: [
      {
        num: String,
        icon: String,
        name: String,
        desc: String,
      },
    ],
    storyMilestones: [
      {
        num: String,
        title: String,
        body: String,
      },
    ],
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
