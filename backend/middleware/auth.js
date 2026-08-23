const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const config = require('../config');

/**
 * Protect routes — verifies JWT from Authorization header.
 * Attaches the full user object (minus password) to req.user.
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Check Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  // Fallback: check query parameter (for direct file downloads/browser links)
  else if (req.query && (req.query.token || req.query.auth)) {
    token = req.query.token || req.query.auth;
  }
  // Fallback: check cookies
  else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return next(new AppError('Not authorized. No token provided.', 401));
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, config.jwtSecret);

    // Find user and attach to request
    const user = await User.findById(decoded.id);

    if (!user) {
      return next(new AppError('User belonging to this token no longer exists.', 401));
    }

    if (!user.isActive) {
      return next(new AppError('User account has been deactivated.', 401));
    }

    req.user = user;
    next();
  } catch (error) {
    return next(new AppError('Not authorized. Token verification failed.', 401));
  }
});

/**
 * Authorize specific roles.
 * Must be used AFTER the protect middleware.
 *
 * @param  {...string} roles - Allowed roles (e.g., 'ADMIN', 'TEACHER')
 * @returns {Function} Express middleware
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Not authorized. Please log in.', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(`Role '${req.user.role}' is not authorized to access this resource.`, 403)
      );
    }

    next();
  };
};

module.exports = { protect, authorize };
