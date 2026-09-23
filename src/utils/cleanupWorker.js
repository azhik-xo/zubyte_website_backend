import mongoose from 'mongoose';
import { Inquiry } from '../models/Inquiry.js';
import { getAttachmentBucket, deleteFileFromGridFS } from '../config/gridfs.js';

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

/**
 * Sweeps and deletes contacted inquiries and their attachments older than 24 hours
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
        const attachmentPath = inq.attachment?.path || '';

        // 1. Purge GridFS attachment if stored in MongoDB
        if (attachmentPath.includes('/api/contact/attachment/')) {
          try {
            const fileId = attachmentPath.split('/api/contact/attachment/')[1]?.split('?')[0];
            if (fileId && mongoose.Types.ObjectId.isValid(fileId)) {
              const bucket = getAttachmentBucket();
              await deleteFileFromGridFS(bucket, fileId);
              console.log(`  ✓ GridFS attachment purged for inquiry ${inq._id}`);
            }
          } catch (gridErr) {
            console.warn(`  ✕ Could not purge GridFS attachment for ${inq._id}:`, gridErr.message);
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
