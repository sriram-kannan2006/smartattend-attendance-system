const AuditLog = require('../models/AuditLog');

/**
 * Creates an audit log entry for tracking important system events.
 * Handles flexible argument orders:
 * - (userId, action, resource, resourceId, details, req)
 * - (action, userId, details)
 */
const logAudit = async (...args) => {
  try {
    let userId, action, resource, resourceId, details = {}, req = null;

    if (args.length >= 2 && typeof args[0] === 'string' && args[0].toUpperCase() === args[0] && !args[0].match(/^[0-9a-fA-F]{24}$/)) {
      // Called as: logAudit(action, userId, details, req)
      [action, userId, details = {}, req = null] = args;
      resource = details.resource || 'System';
      resourceId = details.resourceId || details.id;
    } else {
      // Called as: logAudit(userId, action, resource, resourceId, details, req)
      [userId, action, resource = 'System', resourceId = null, details = {}, req = null] = args;
    }

    await AuditLog.create({
      userId: (userId && mongoose.Types.ObjectId.isValid(userId)) ? userId : null,
      action: action || 'UNKNOWN',
      resource: resource || 'System',
      resourceId: (resourceId && mongoose.Types.ObjectId.isValid(resourceId)) ? resourceId : null,
      details: typeof details === 'object' ? details : { raw: details },
      ipAddress: req ? (req.headers?.['x-forwarded-for'] || req.connection?.remoteAddress || req.ip) : null,
      userAgent: req ? req.headers?.['user-agent'] : null,
    });
  } catch (error) {
    // Audit logging should never crash the application
    console.error('Audit log error:', error.message);
  }
};

const mongoose = require('mongoose');

module.exports = { logAudit };
