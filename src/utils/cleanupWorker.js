import mongoose from 'mongoose';
import { Inquiry } from '../models/Inquiry.js';
import { deleteFromCloudinary } from '../config/cloudinary.js';

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

/**
 * Sweeps and deletes contacted inquiries and their Cloudinary attachments older than 24 hours
 */
export const runContactedInquiriesCleanup = async () => {
  try {
    if (mongoose.connection.readyState !== 1) return;

    const expirationCutoff = new Date(Date.now() - TWENTY_FOUR_HOURS_MS);

    // Find all contacted inquiries past 24 hours
    const expiredInquiries = await Inquiry.find({
      status: 'contacted',
      contactedAt: { $lte: expirationCutoff },
    });

    if (expiredInquiries.length > 0) {
      console.log(`[Auto-Cleanup] Found ${expiredInquiries.length} contacted inquiries older than 24 hours to purge...`);

      for (const inq of expiredInquiries) {
        // Purge Cloudinary attachment if present
        if (inq.attachment?.path && inq.attachment.path.includes('res.cloudinary.com')) {
          try {
            await deleteFromCloudinary(inq.attachment.path, 'auto');
            console.log(`  ✓ Cloudinary asset purged for inquiry ${inq._id}`);
          } catch (cloudErr) {
            console.warn(`  ✕ Could not purge Cloudinary asset for ${inq._id}:`, cloudErr.message);
          }
        }

        // Delete from MongoDB
        await Inquiry.findByIdAndDelete(inq._id);
        console.log(`  ✓ Inquiry ${inq._id} (${inq.firstName} ${inq.lastName}) purged from database.`);
      }
    }
  } catch (error) {
    console.error('[Auto-Cleanup Error]', error.message);
  }
};

/**
 * Starts the periodic 24-hour cleanup scheduler
 * Runs immediately on start, then checks every 30 minutes
 */
export const startCleanupWorker = (intervalMs = 30 * 60 * 1000) => {
  console.log('[Auto-Cleanup Worker] Initialized (checks every 30m for contacted inquiries > 24h old)');
  
  // Initial run
  runContactedInquiriesCleanup();

  // Recurring interval
  const timer = setInterval(() => {
    runContactedInquiriesCleanup();
  }, intervalMs);

  return timer;
};

