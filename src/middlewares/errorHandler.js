import { ApiResponse } from '../utils/apiResponse.js';

/**
 * Centralized Express Error Handling Middleware
 */
export const errorHandler = (err, req, res, next) => {
  console.error(`[Error] ${err.name}: ${err.message}`);
  if (err.stack && process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val) => val.message);
    return ApiResponse.badRequest(res, 'Validation Error', messages);
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return ApiResponse.badRequest(res, `Duplicate field value entered: ${field}`);
  }

  // Mongoose bad ObjectId (CastError)
  if (err.name === 'CastError') {
    return ApiResponse.notFound(res, `Resource with id '${err.value}' not found`);
  }

  // Multer file upload error
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return ApiResponse.badRequest(res, 'File size exceeds maximum limit of 15MB');
    }
    return ApiResponse.badRequest(res, `Upload error: ${err.message}`);
  }

  // Default internal server error
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  return ApiResponse.error(
    res,
    message,
    statusCode,
    process.env.NODE_ENV === 'development' ? { stack: err.stack } : null
  );
};

