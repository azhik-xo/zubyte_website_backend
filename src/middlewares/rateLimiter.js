import rateLimit from 'express-rate-limit';
import { ApiResponse } from '../utils/apiResponse.js';

/**
 * Rate limiter for public contact and form submissions
 * Limits to 15 requests per 15-minute window per IP.
 */
export const contactFormLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return ApiResponse.error(
      res,
      'Too many form submissions from this IP. Please try again after 15 minutes.',
      429
    );
  },
});

/**
 * General API rate limiter
 * 200 requests per 15-minute window.
 */
export const generalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return ApiResponse.error(
      res,
      'Too many requests from this IP. Please slow down.',
      429
    );
  },
});

