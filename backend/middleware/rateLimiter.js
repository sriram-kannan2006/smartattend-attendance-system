const rateLimit = require('express-rate-limit');
const config = require('../config');

/** Rate limiter for authentication endpoints (login, register) */
const authLimiter = rateLimit({
  windowMs: config.rateLimit.auth.windowMs,
  max: config.rateLimit.auth.max,
  message: {
    success: false,
    status: 'fail',
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/** General API rate limiter */
const apiLimiter = rateLimit({
  windowMs: config.rateLimit.api.windowMs,
  max: config.rateLimit.api.max,
  message: {
    success: false,
    status: 'fail',
    message: 'Too many requests. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/** Rate limiter for face recognition endpoints */
const faceLimiter = rateLimit({
  windowMs: config.rateLimit.face.windowMs,
  max: config.rateLimit.face.max,
  message: {
    success: false,
    status: 'fail',
    message: 'Too many face verification attempts. Please try again after 5 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { authLimiter, apiLimiter, faceLimiter };
