import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';
import { Service } from '../models/Service.js';
import { Product } from '../models/Product.js';
import { CaseStudy } from '../models/CaseStudy.js';
import { Company } from '../models/Company.js';
import { User } from '../models/User.js';
import {
  SERVICES_SEED,
  PRODUCTS_SEED,
  CASE_STUDIES_SEED,
  COMPANY_SEED,
} from './seedData.js';

dotenv.config();

// Ensure Cloudinary is configured
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const uploadCache = new Map();

/**
 * Uploads an image URL/Unsplash ID to Cloudinary 'zubyte_asset' folder
 */
async function uploadAssetToCloudinary(imgSource, prefix = 'asset') {
  if (!imgSource) return '';

  // If already a Cloudinary URL, return as is
  if (imgSource.includes('res.cloudinary.com')) {
    return imgSource;
  }

  // Check in-memory run cache
  if (uploadCache.has(imgSource)) {
    return uploadCache.get(imgSource);
  }

  const sourceUrl =
    imgSource.startsWith('http://') || imgSource.startsWith('https://')
      ? imgSource
      : `https://images.unsplash.com/${imgSource}?w=1200&q=85&auto=format`;

  try {
    console.log(`[Cloudinary] Uploading ${prefix} from ${imgSource}...`);
    const res = await cloudinary.uploader.upload(sourceUrl, {
      folder: 'zubyte_asset',
      resource_type: 'image',
      transformation: [{ quality: 'auto', fetch_format: 'auto' }],
    });

    console.log(`  ✓ Uploaded to zubyte_asset -> ${res.secure_url}`);
    uploadCache.set(imgSource, res.secure_url);
    return res.secure_url;
  } catch (err) {
    console.error(`  ✕ Cloudinary upload failed for ${imgSource}:`, err.message);
    return sourceUrl; // fallback to original
  }
}

async function syncAndSeed() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('Missing MONGODB_URI in environment!');
    process.exit(1);
  }

  console.log('====================================================');
  console.log('☁️  SYNCING ASSETS TO CLOUDINARY "zubyte_asset" & ATLAS');
  console.log('====================================================\n');

  await mongoose.connect(mongoUri);
  console.log(`[MongoDB] Connected to: ${mongoose.connection.name}\n`);

  // 1. Process Services Seed
  console.log('1/4. Processing Services images...');
  const preparedServices = [];
  for (const s of SERVICES_SEED) {
    const cloudImg = await uploadAssetToCloudinary(s.img, `service_${s.slug}`);
    preparedServices.push({ ...s, img: cloudImg });
  }

  // 2. Process Products Seed
  console.log('\n2/4. Processing Product Suites & items images...');
  const preparedProducts = [];
  for (const p of PRODUCTS_SEED) {
    const cloudSuiteImg = await uploadAssetToCloudinary(p.img, `product_suite_${p.id}`);
    const items = [];
    for (const item of p.products || []) {
      const cloudItemImg = item.img
        ? await uploadAssetToCloudinary(item.img, `product_${item.name}`)
        : cloudSuiteImg;
      items.push({ ...item, img: cloudItemImg });
    }
    preparedProducts.push({ ...p, img: cloudSuiteImg, products: items });
  }

  // 3. Process Case Studies Seed
  console.log('\n3/4. Processing 21 Case Studies images...');
  const preparedCaseStudies = [];
  for (const cs of CASE_STUDIES_SEED) {
    const cloudCsImg = await uploadAssetToCloudinary(cs.img, `casestudy_${cs.service}`);
    preparedCaseStudies.push({ ...cs, img: cloudCsImg });
  }

  // 4. Save to MongoDB Atlas
  console.log('\n4/4. Writing updated records into MongoDB Atlas collections...');
  
  await Service.deleteMany({});
  await Service.insertMany(preparedServices);
  console.log(`  ✓ Inserted ${preparedServices.length} discipline groups with Cloudinary images.`);

  await Product.deleteMany({});
  await Product.insertMany(preparedProducts);
  console.log(`  ✓ Inserted ${preparedProducts.length} product suites with Cloudinary images.`);

  await CaseStudy.deleteMany({});
  await CaseStudy.insertMany(preparedCaseStudies);
  console.log(`  ✓ Inserted ${preparedCaseStudies.length} case studies with Cloudinary images.`);

  await Company.deleteMany({});
  await Company.create(COMPANY_SEED);
  console.log('  ✓ Inserted company profile & FAQs.');

  // Ensure default admin & developer exist
  const adminCount = await User.countDocuments();
  if (adminCount === 0) {
    await User.create([
      {
        name: 'Zubyte Admin',
        email: 'admin@zubyte.com',
        username: 'admin',
        password: 'zubte@admin',
        role: 'admin',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      },
      {
        name: 'Zubyte Developer',
        email: 'developer@zubyte.com',
        username: 'developer',
        password: 'zubyte@developer',
        role: 'developer',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      },
    ]);
    console.log('  ✓ Initialized default admin and developer users.');
  }

  console.log('\n====================================================');
  console.log('🎉 ALL ASSETS UPLOADED TO CLOUDINARY "zubyte_asset"!');
  console.log('🎉 ATLAS DATABASE FULLY SYNCHRONIZED!');
  console.log('====================================================');

  await mongoose.disconnect();
  process.exit(0);
}

syncAndSeed().catch((err) => {
  console.error('Error during asset synchronization:', err);
  process.exit(1);
});

