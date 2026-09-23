import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { getImageBucket, getAttachmentBucket, uploadBufferToGridFS } from '../config/gridfs.js';
import { Image } from '../models/Image.js';
import { CaseStudy } from '../models/CaseStudy.js';
import { Product } from '../models/Product.js';
import { Service } from '../models/Service.js';
import { Company } from '../models/Company.js';
import { Inquiry } from '../models/Inquiry.js';
import { SERVICES_SEED } from '../seeds/seedData.js';
import { sanitizeFilename, detectImageMimeType } from '../utils/fileValidation.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Memory cache to deduplicate assets downloaded during migration
const urlCache = new Map();

/**
 * Downloads an asset from a URL and returns buffer + mime type
 * @param {string} url
 * @returns {Promise<{ buffer: Buffer, contentType: string, filename: string }>}
 */
async function fetchRemoteAsset(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText} fetching ${url}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  let contentType = response.headers.get('content-type') || '';
  if (!contentType || contentType === 'application/octet-stream') {
    contentType = detectImageMimeType(buffer) || 'image/jpeg';
  }

  // Derive a base filename from URL path
  const urlPath = new URL(url).pathname;
  const rawBasename = path.basename(urlPath) || 'asset';

  return { buffer, contentType, filename: rawBasename };
}

/**
 * Migrate a single image asset URL to MongoDB GridFS 'image_files'
 * Deduplicates by source URL
 * @param {mongoose.mongo.GridFSBucket} imageBucket
 * @param {string} cloudinaryUrl
 * @returns {Promise<string>} - New image URL (/api/images/:id)
 */
async function migrateImageAsset(imageBucket, cloudinaryUrl, fallbackUrl = null) {
  if (!cloudinaryUrl || typeof cloudinaryUrl !== 'string') return cloudinaryUrl;
  if (!cloudinaryUrl.includes('res.cloudinary.com')) return cloudinaryUrl; // Skip non-Cloudinary

  // 1. Check in-memory run cache
  if (urlCache.has(cloudinaryUrl)) {
    return urlCache.get(cloudinaryUrl);
  }

  // 2. Check if already migrated in Image collection (sourceUrl lookup)
  const existingImage = await Image.findOne({ sourceUrl: cloudinaryUrl }).lean();
  if (existingImage) {
    const newUrl = `/api/images/${existingImage._id}`;
    urlCache.set(cloudinaryUrl, newUrl);
    return newUrl;
  }

  // 3. Download from Cloudinary over HTTPS
  console.log(`  ⬇️  Downloading from Cloudinary: ${cloudinaryUrl}`);
  let asset;
  try {
    asset = await fetchRemoteAsset(cloudinaryUrl);
  } catch (fetchErr) {
    if (fallbackUrl) {
      console.log(`  ⚠️  Cloudinary asset 404. Falling back to source: ${fallbackUrl}`);
      asset = await fetchRemoteAsset(fallbackUrl);
    } else {
      throw fetchErr;
    }
  }

  const { buffer, contentType, filename } = asset;

  // 4. Sanitize filename
  const safeFilename = sanitizeFilename(filename);

  // 5. Store binary in GridFS 'image_files' bucket
  const fileId = await uploadBufferToGridFS(imageBucket, buffer, safeFilename, {
    contentType,
    metadata: {
      migratedFrom: cloudinaryUrl,
      migratedAt: new Date(),
    },
  });

  // 6. Create Image metadata document
  const imageDoc = await Image.create({
    filename: safeFilename,
    originalName: filename,
    contentType,
    size: buffer.length,
    fileId,
    sourceUrl: cloudinaryUrl,
  });

  const newUrl = `/api/images/${imageDoc._id}`;
  urlCache.set(cloudinaryUrl, newUrl);
  console.log(`  ✅ Stored in GridFS [${fileId}] -> ${newUrl}`);

  return newUrl;
}

/**
 * Main migration procedure
 */
export async function runMigration() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('Missing MONGODB_URI in environment!');
    process.exit(1);
  }

  console.log('====================================================');
  console.log('🚀 ZUBYTE STORAGE MIGRATION: CLOUDINARY -> MONGODB GRIDFS');
  console.log('====================================================\n');

  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
  } catch (connErr) {
    if (connErr.code === 'ECONNREFUSED' || (connErr.message && connErr.message.includes('querySrv'))) {
      const dns = await import('dns');
      dns.setServers(['8.8.8.8', '1.1.1.1']);
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 8000 });
    } else {
      throw connErr;
    }
  }
  console.log(`[MongoDB] Connected to database: ${mongoose.connection.name}\n`);

  const imageBucket = getImageBucket();
  const attachmentBucket = getAttachmentBucket();

  const backupData = {
    timestamp: new Date().toISOString(),
    database: mongoose.connection.name,
    records: [],
  };

  let totalMigrated = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  try {
    // ─── 1. CASE STUDIES ──────────────────────────────────────────────
    console.log('--- 1/5. Processing Case Studies ---');
    const caseStudies = await CaseStudy.find({}).lean();
    console.log(`Found ${caseStudies.length} case studies in database.`);

    for (const cs of caseStudies) {
      if (cs.img && cs.img.includes('res.cloudinary.com')) {
        backupData.records.push({
          collection: 'CaseStudy',
          id: cs._id.toString(),
          field: 'img',
          originalValue: cs.img,
        });

        try {
          const newImgUrl = await migrateImageAsset(imageBucket, cs.img);
          await CaseStudy.findByIdAndUpdate(cs._id, { img: newImgUrl });
          console.log(`  ✓ Updated CaseStudy "${cs.title}"`);
          totalMigrated++;
        } catch (err) {
          console.error(`  ✕ Error migrating CaseStudy "${cs.title}":`, err.message);
          totalErrors++;
        }
      } else {
        totalSkipped++;
      }
    }

    // ─── 2. PRODUCTS ──────────────────────────────────────────────────
    console.log('\n--- 2/5. Processing Product Suites ---');
    const products = await Product.find({}).lean();
    console.log(`Found ${products.length} product suites in database.`);

    for (const p of products) {
      let updated = false;
      const updatePayload = {};

      if (p.img && p.img.includes('res.cloudinary.com')) {
        backupData.records.push({
          collection: 'Product',
          id: p._id.toString(),
          field: 'img',
          originalValue: p.img,
        });

        try {
          const newSuiteImg = await migrateImageAsset(imageBucket, p.img);
          updatePayload.img = newSuiteImg;
          updated = true;
          totalMigrated++;
        } catch (err) {
          console.error(`  ✕ Error migrating Product suite "${p.label}":`, err.message);
          totalErrors++;
        }
      }

      // Check sub-products
      if (Array.isArray(p.products)) {
        const migratedProducts = [];
        for (const item of p.products) {
          if (item.img && item.img.includes('res.cloudinary.com')) {
            backupData.records.push({
              collection: 'Product.products',
              id: p._id.toString(),
              itemId: item._id ? item._id.toString() : item.name,
              field: 'img',
              originalValue: item.img,
            });

            try {
              const newItemImg = await migrateImageAsset(imageBucket, item.img);
              migratedProducts.push({ ...item, img: newItemImg });
              updated = true;
              totalMigrated++;
            } catch (err) {
              console.error(`  ✕ Error migrating item "${item.name}":`, err.message);
              migratedProducts.push(item);
              totalErrors++;
            }
          } else {
            migratedProducts.push(item);
          }
        }
        if (updated) {
          updatePayload.products = migratedProducts;
        }
      }

      if (updated) {
        await Product.findByIdAndUpdate(p._id, updatePayload);
        console.log(`  ✓ Updated Product suite "${p.label}"`);
      } else {
        totalSkipped++;
      }
    }

    // ─── 3. SERVICES ──────────────────────────────────────────────────
    console.log('\n--- 3/5. Processing Service Disciplines ---');
    const services = await Service.find({}).lean();
    console.log(`Found ${services.length} services in database.`);

    for (const s of services) {
      if (s.img && s.img.includes('res.cloudinary.com')) {
        backupData.records.push({
          collection: 'Service',
          id: s._id.toString(),
          field: 'img',
          originalValue: s.img,
        });

        try {
          const fallbackSeed = SERVICES_SEED.find((seed) => seed.group === s.group)?.img;
          const fallbackUrl = fallbackSeed
            ? fallbackSeed.startsWith('http')
              ? fallbackSeed
              : `https://images.unsplash.com/${fallbackSeed}?w=1200&q=85&auto=format`
            : null;

          const newServiceImg = await migrateImageAsset(imageBucket, s.img, fallbackUrl);
          await Service.findByIdAndUpdate(s._id, { img: newServiceImg });
          console.log(`  ✓ Updated Service "${s.group}"`);
          totalMigrated++;
        } catch (err) {
          console.error(`  ✕ Error migrating Service "${s.group}":`, err.message);
          totalErrors++;
        }
      } else {
        totalSkipped++;
      }
    }

    // ─── 4. COMPANY CLIENT LOGOS ──────────────────────────────────────
    console.log('\n--- 4/5. Processing Company Client Logos ---');
    const company = await Company.findOne({}).lean();
    if (company && Array.isArray(company.clientLogos)) {
      let companyUpdated = false;
      const updatedLogos = [];

      for (const logo of company.clientLogos) {
        if (logo.logoUrl && logo.logoUrl.includes('res.cloudinary.com')) {
          backupData.records.push({
            collection: 'Company.clientLogos',
            id: company._id.toString(),
            logoName: logo.name,
            field: 'logoUrl',
            originalValue: logo.logoUrl,
          });

          try {
            const newLogoUrl = await migrateImageAsset(imageBucket, logo.logoUrl);
            updatedLogos.push({ ...logo, logoUrl: newLogoUrl });
            companyUpdated = true;
            totalMigrated++;
          } catch (err) {
            console.error(`  ✕ Error migrating logo "${logo.name}":`, err.message);
            updatedLogos.push(logo);
            totalErrors++;
          }
        } else {
          updatedLogos.push(logo);
        }
      }

      if (companyUpdated) {
        await Company.findByIdAndUpdate(company._id, { clientLogos: updatedLogos });
        console.log(`  ✓ Updated Company client logos.`);
      } else {
        console.log('  ✓ No Cloudinary client logos found to migrate.');
      }
    }

    // ─── 5. INQUIRY ATTACHMENTS ───────────────────────────────────────
    console.log('\n--- 5/5. Processing Inquiry Attachments ---');
    const inquiries = await Inquiry.find({ 'attachment.path': { $regex: 'res\\.cloudinary\\.com' } }).lean();
    console.log(`Found ${inquiries.length} inquiries with Cloudinary attachments.`);

    for (const inq of inquiries) {
      if (inq.attachment && inq.attachment.path) {
        backupData.records.push({
          collection: 'Inquiry',
          id: inq._id.toString(),
          field: 'attachment.path',
          originalValue: inq.attachment.path,
        });

        try {
          console.log(`  ⬇️  Downloading attachment: ${inq.attachment.path}`);
          const { buffer, contentType, filename } = await fetchRemoteAsset(inq.attachment.path);
          const safeName = sanitizeFilename(inq.attachment.originalName || filename);

          const fileId = await uploadBufferToGridFS(attachmentBucket, buffer, safeName, {
            contentType: inq.attachment.mimeType || contentType,
            metadata: {
              originalName: inq.attachment.originalName || filename,
              sizeBytes: buffer.length,
              inquiryId: inq._id,
              migratedFrom: inq.attachment.path,
            },
          });

          const newAttachmentPath = `/api/contact/attachment/${fileId}`;
          await Inquiry.findByIdAndUpdate(inq._id, {
            'attachment.path': newAttachmentPath,
            'attachment.filename': safeName,
          });
          console.log(`  ✅ Stored attachment in GridFS [${fileId}] -> ${newAttachmentPath}`);
          totalMigrated++;
        } catch (err) {
          console.error(`  ✕ Error migrating attachment for inquiry ${inq._id}:`, err.message);
          totalErrors++;
        }
      }
    }

    // ─── SAVE BACKUP SNAPSHOT ─────────────────────────────────────────
    const backupDir = path.join(__dirname, '../../backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    const backupFilePath = path.join(
      backupDir,
      `migration-backup-${Date.now()}.json`
    );
    fs.writeFileSync(backupFilePath, JSON.stringify(backupData, null, 2));

    console.log('\n====================================================');
    console.log('🎉 MIGRATION SUMMARY');
    console.log('====================================================');
    console.log(`  Total Assets Migrated: ${totalMigrated}`);
    console.log(`  Total Unchanged/Skipped: ${totalSkipped}`);
    console.log(`  Total Errors:            ${totalErrors}`);
    console.log(`  Deduplication:          ${urlCache.size} unique Cloudinary assets cached.`);
    console.log(`  Backup Snapshot Saved:   ${backupFilePath}`);
    console.log('====================================================\n');
  } catch (globalErr) {
    console.error('Fatal error during migration:', globalErr);
  } finally {
    await mongoose.disconnect();
    console.log('[MongoDB] Connection closed.');
  }
}

// Allow direct CLI execution
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMigration()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
