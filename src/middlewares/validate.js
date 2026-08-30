import { ApiResponse } from '../utils/apiResponse.js';

/**
 * Validates required fields in the request body
 * @param {Array<string>} requiredFields - List of required field names
 */
export const requireFields = (requiredFields) => {
  return (req, res, next) => {
    const missing = [];
    for (const field of requiredFields) {
      if (!req.body[field] || String(req.body[field]).trim() === '') {
        missing.push(field);
      }
    }

    if (missing.length > 0) {
      return ApiResponse.badRequest(
        res,
        `Missing required fields: ${missing.join(', ')}`,
        missing.map((f) => `${f} is required`)
      );
    }

    next();
  };
};

/**
 * Validates email format
 */
export const validateEmail = (req, res, next) => {
  const email = req.body.email;
  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return ApiResponse.badRequest(res, 'Please provide a valid email address');
    }
  }
  next();
};

