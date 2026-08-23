const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');
const mongoose = require('mongoose');
const config = require('../config');
const AttendanceSession = require('../models/AttendanceSession');
const AppError = require('../utils/AppError');

/**
 * QR Service - Manages dynamic QR code generation, rotation, and validation.
 */

const findSession = async (sessionId) => {
  if (!sessionId) return null;
  let session = null;
  if (mongoose.Types.ObjectId.isValid(sessionId)) {
    session = await AttendanceSession.findById(sessionId);
  }
  if (!session) {
    session = await AttendanceSession.findOne({ sessionId });
  }
  return session;
};

const generateSessionId = (sessionData) => {
  const date = new Date(sessionData.date || Date.now());
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = uuidv4().slice(0, 6).toUpperCase();
  return `ATT-${dateStr}-H${sessionData.hour || 1}-${random}`;
};

const generateQRToken = async (sessionId) => {
  const session = await findSession(sessionId);
  if (!session) {
    throw new AppError('Attendance session not found.', 404);
  }

  const token = uuidv4();
  const expiresAt = new Date(Date.now() + (session.tokenRotationInterval || config.qr.tokenExpiry || 10) * 1000);

  session.currentQrToken = token;
  session.currentQrExpiresAt = expiresAt;
  if (session.status === 'CREATED') {
    session.status = 'ACTIVE';
  }
  await session.save();

  return { token, expiresAt, sessionId: session.sessionId, id: session._id };
};

const rotateQRToken = async (sessionId) => {
  return await generateQRToken(sessionId);
};

const validateQRToken = async (token, sessionId) => {
  const session = await findSession(sessionId);

  if (!session) {
    return { valid: false, reason: 'Session not found' };
  }

  if (session.status !== 'ACTIVE') {
    return { valid: false, reason: 'Session is not active' };
  }

  if (session.currentQrToken && session.currentQrToken !== token) {
    return { valid: false, reason: 'Invalid or expired QR token' };
  }

  return { valid: true, session };
};

const generateQRImage = async (session) => {
  const qrData = JSON.stringify({
    sessionId: session._id.toString(),
    token: session.currentQrToken || uuidv4(),
    sid: session.sessionId,
  });

  const qrDataUrl = await QRCode.toDataURL(qrData, {
    width: 400,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
    errorCorrectionLevel: 'M',
  });

  return qrDataUrl;
};

const getCurrentQR = async (sessionId) => {
  let session = await findSession(sessionId);

  if (!session) {
    throw new AppError('Attendance session not found.', 404);
  }

  // Populate references
  session = await AttendanceSession.findById(session._id)
    .populate('classId', 'name year')
    .populate('subjectId', 'name code')
    .populate('teacherId', 'name');

  // Rotate if expired or missing
  if (!session.currentQrToken || (session.currentQrExpiresAt && new Date() > session.currentQrExpiresAt)) {
    await generateQRToken(session._id);
    session = await AttendanceSession.findById(session._id)
      .populate('classId', 'name year')
      .populate('subjectId', 'name code')
      .populate('teacherId', 'name');
  }

  const qrImage = await generateQRImage(session);

  return {
    qrImage,
    token: session.currentQrToken,
    expiresAt: session.currentQrExpiresAt,
    session: {
      id: session._id,
      sessionId: session.sessionId,
      className: session.classId?.name || 'Class',
      subjectName: session.subjectId?.name || 'Subject',
      hour: session.hour,
      date: session.date,
      presentCount: session.presentCount || 0,
      odCount: session.odCount || 0,
      totalStudents: session.totalStudents || 50,
      rotationInterval: session.tokenRotationInterval || 10,
    },
  };
};

module.exports = {
  findSession,
  generateSessionId,
  generateQRToken,
  rotateQRToken,
  validateQRToken,
  generateQRImage,
  getCurrentQR,
};
