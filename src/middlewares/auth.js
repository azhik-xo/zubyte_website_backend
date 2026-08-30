import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { ApiResponse } from '../utils/apiResponse.js';

/**
 * Protect routes - Verifies JWT Bearer Token and attaches user to req.user
 */
export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return ApiResponse.error(
      res,
      'Access denied. Not authorized to access this route. Please log in.',
      401
    );
  }

  try {
    const secret = process.env.JWT_SECRET || 'zubyte_jwt_super_secret_production_key_2026_x99!';
    const decoded = jwt.verify(token, secret);

    if (mongoose.connection.readyState === 1) {
      const user = await User.findById(decoded.id).select('-password');
      if (user) {
        req.user = user;
        return next();
      }
    }

    // Fallback if DB is offline or user was decoded directly
    req.user = {
      _id: decoded.id,
      id: decoded.id,
      name: decoded.name,
      email: decoded.email,
      username: decoded.username,
      role: decoded.role,
    };

    next();
  } catch (error) {
    return ApiResponse.error(
      res,
      'Invalid or expired authentication token. Please log in again.',
      401
    );
  }
};

/**
 * Role-Based Access Control Middleware
 * @param  {...string} roles - Allowed roles (e.g., 'admin', 'developer')
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return ApiResponse.error(
        res,
        `Forbidden: Role '${req.user?.role || 'anonymous'}' is not authorized to perform this action. Required: ${roles.join(' or ')}.`,
        403
      );
    }
    next();
  };
};
