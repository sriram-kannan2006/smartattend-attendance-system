const AppError = require('../utils/AppError');
const config = require('../config');

/**
 * Global error handling middleware.
 * Handles Mongoose errors, JWT errors, and custom AppErrors.
 */
const errorHandler = (err, req, res, _next) => {
  let error = { ...err };
  error.message = err.message;
  error.stack = err.stack;

  // Log error in development
  if (config.env === 'development') {
    console.error('❌ Error:', err);
  }

  // Mongoose bad ObjectId (CastError)
  if (err.name === 'CastError') {
    const message = `Resource not found with id: ${err.value}`;
    error = new AppError(message, 404);
  }

  // Mongoose duplicate key (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    const message = `Duplicate value for '${field}': '${value}'. Please use another value.`;
    error = new AppError(message, 400);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    const message = `Validation failed: ${messages.join('. ')}`;
    error = new AppError(message, 400);
  }

  // JWT invalid token
  if (err.name === 'JsonWebTokenError') {
    error = new AppError('Invalid token. Please log in again.', 401);
  }

  // JWT expired token
  if (err.name === 'TokenExpiredError') {
    error = new AppError('Token expired. Please log in again.', 401);
  }

  // Default status code and status
  const statusCode = error.statusCode || 500;
  const status = error.status || 'error';

  const responseBody = {
    success: false,
    status,
    message: error.message || 'Internal Server Error',
  };

  // Include stack trace in development
  if (config.env === 'development') {
    responseBody.stack = error.stack;
  }

  res.status(statusCode).json(responseBody);
};

module.exports = errorHandler;
