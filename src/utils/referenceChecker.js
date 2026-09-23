import { CaseStudy } from '../models/CaseStudy.js';
import { Product } from '../models/Product.js';
import { Service } from '../models/Service.js';
import { Company } from '../models/Company.js';
import { Inquiry } from '../models/Inquiry.js';
import { User } from '../models/User.js';

/**
 * Checks whether an image ID or image URL is referenced anywhere across the database
 * @param {string} imageIdOrUrl - The ObjectId string, fileId, or URL path
 * @returns {Promise<boolean>}
 */
export const isImageReferenced = async (imageIdOrUrl) => {
  if (!imageIdOrUrl) return false;

  const idStr = String(imageIdOrUrl).trim();
  // Build a regex matching the ID as a standalone ID or part of /api/images/:id
  const idRegex = new RegExp(idStr.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i');

  try {
    const [caseStudyHit, productHit, serviceHit, companyHit, inquiryHit, userHit] =
      await Promise.all([
        CaseStudy.exists({ img: idRegex }),
        Product.exists({ $or: [{ img: idRegex }, { 'products.img': idRegex }] }),
        Service.exists({ img: idRegex }),
        Company.exists({ 'clientLogos.logoUrl': idRegex }),
        Inquiry.exists({ 'attachment.path': idRegex }),
        User.exists({ avatar: idRegex }),
      ]);

    return Boolean(
      caseStudyHit || productHit || serviceHit || companyHit || inquiryHit || userHit
    );
  } catch (err) {
    console.warn(`[ReferenceChecker] Error checking reference for ${idStr}:`, err.message);
    // If in error state, assume referenced for safety to avoid accidental deletion
    return true;
  }
};

