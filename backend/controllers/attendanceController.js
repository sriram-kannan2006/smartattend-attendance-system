const asyncHandler = require('../utils/asyncHandler');
const attendanceService = require('../services/attendanceService');
const qrService = require('../services/qrService');
const AppError = require('../utils/AppError');

/**
 * @desc    Create a new attendance session
 * @route   POST /api/attendance/session
 * @access  Private (TEACHER)
 */
const createSession = asyncHandler(async (req, res) => {
  const { classId, subjectId, date, hour } = req.body;

  const result = await attendanceService.createSession({
    teacherUserId: req.user._id,
    classId,
    subjectId,
    date: date || new Date(),
    hour,
  }, req);

  res.status(201).json({
    success: true,
    message: 'Attendance session created',
    data: result,
  });
});

/**
 * @desc    Get session details with attendance
 * @route   GET /api/attendance/session/:id
 * @access  Private (TEACHER, ADMIN)
 */
const getSession = asyncHandler(async (req, res) => {
  const result = await attendanceService.getSessionAttendance(req.params.id);

  res.status(200).json({
    success: true,
    data: result,
  });
});

/**
 * @desc    Get current QR code for a session
 * @route   GET /api/attendance/session/:id/qr
 * @access  Private (TEACHER)
 */
const getSessionQR = asyncHandler(async (req, res) => {
  const qrData = await qrService.getCurrentQR(req.params.id);

  res.status(200).json({
    success: true,
    data: qrData,
  });
});

/**
 * @desc    Rotate QR token for a session
 * @route   POST /api/attendance/session/:id/rotate-qr
 * @access  Private (TEACHER)
 */
const rotateQR = asyncHandler(async (req, res) => {
  const tokenData = await qrService.rotateQRToken(req.params.id);

  res.status(200).json({
    success: true,
    data: tokenData,
  });
});

/**
 * @desc    Mark attendance (student scans QR after face verification)
 * @route   POST /api/attendance/scan
 * @access  Private (STUDENT)
 */
const scanAttendance = asyncHandler(async (req, res) => {
  const { sessionId, qrToken, faceAuthId, location, deviceInfo } = req.body;

  const result = await attendanceService.markPresent({
    studentUserId: req.user._id,
    sessionId,
    qrToken,
    faceAuthId,
    location,
    deviceInfo,
  }, req);

  // Emit real-time event (socket)
  if (req.app.get('io')) {
    const io = req.app.get('io');
    const eventPayload = {
      studentId: result.studentId,
      studentName: result.studentName,
      registerNumber: result.registerNumber,
      status: result.status,
      presentCount: result.presentCount,
      timestamp: new Date(),
    };
    io.to(`session:${sessionId}`).emit('attendance:marked', eventPayload);
    if (result.sessionId) io.to(`session:${result.sessionId}`).emit('attendance:marked', eventPayload);
    if (result.sessionMongoId) io.to(`session:${result.sessionMongoId}`).emit('attendance:marked', eventPayload);
    io.emit('attendance:update', { sessionId, ...eventPayload });
  }

  res.status(200).json({
    success: true,
    message: `Attendance marked as ${result.status}`,
    data: {
      status: result.status,
      studentName: result.studentName,
      registerNumber: result.registerNumber,
      sessionId: result.sessionId,
    },
  });
});

/**
 * @desc    Close attendance session and finalize
 * @route   POST /api/attendance/session/:id/close
 * @access  Private (TEACHER)
 */
const closeSession = asyncHandler(async (req, res) => {
  const result = await attendanceService.finalizeAttendance(
    req.params.id,
    req.user._id,
    req
  );

  // Emit session closed event
  if (req.app.get('io')) {
    req.app.get('io').to(`session:${req.params.id}`).emit('session:closed', {
      session: result.session,
      stats: result.stats,
    });
  }

  res.status(200).json({
    success: true,
    message: 'Attendance session closed and finalized',
    data: result,
  });
});

/**
 * @desc    Get student attendance history
 * @route   GET /api/attendance/student/:id
 * @access  Private (STUDENT, TEACHER, ADMIN, PARENT)
 */
const getStudentAttendance = asyncHandler(async (req, res) => {
  const Student = require('../models/Student');
  let studentId = req.params.id;

  // If student is requesting their own data
  if (req.user.role === 'STUDENT') {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) throw new AppError('Student profile not found.', 404);
    studentId = student._id;
  }

  const result = await attendanceService.getStudentAttendance(studentId, {
    startDate: req.query.startDate,
    endDate: req.query.endDate,
    subjectId: req.query.subjectId,
  });

  res.status(200).json({
    success: true,
    data: result,
  });
});

/**
 * @desc    Get teacher's sessions
 * @route   GET /api/attendance/teacher/sessions
 * @access  Private (TEACHER)
 */
const getTeacherSessions = asyncHandler(async (req, res) => {
  const sessions = await attendanceService.getTeacherSessions(req.user._id, {
    date: req.query.date,
    status: req.query.status,
  });

  res.status(200).json({
    success: true,
    count: sessions.length,
    data: sessions,
  });
});

/**
 * @desc    Correct attendance record
 * @route   PUT /api/attendance/:id/correct
 * @access  Private (TEACHER, ADMIN)
 */
const correctAttendance = asyncHandler(async (req, res) => {
  const { status, reason } = req.body;

  const result = await attendanceService.correctAttendance(
    req.params.id,
    status,
    reason,
    req.user._id,
    req
  );

  res.status(200).json({
    success: true,
    message: 'Attendance record corrected',
    data: result,
  });
});

/**
 * @desc    Manual attendance marking / exception by teacher
 * @route   POST /api/attendance/session/:id/manual-mark
 * @access  Private (TEACHER)
 */
const manualMark = asyncHandler(async (req, res) => {
  const { studentId, status, reason } = req.body;

  const result = await attendanceService.manualMarkAttendance(
    req.params.id,
    { studentId, status, reason },
    req.user._id,
    req
  );

  // Emit real-time socket event
  if (req.app.get('io')) {
    req.app.get('io').to(`session:${req.params.id}`).emit('attendance:marked', {
      studentName: result.studentName,
      registerNumber: result.registerNumber,
      status: result.status,
      reason: result.reason,
      presentCount: result.stats.present,
      timestamp: new Date(),
    });
  }

  res.status(200).json({
    success: true,
    message: `Attendance marked as ${result.status} for ${result.studentName}`,
    data: result,
  });
});

module.exports = {
  createSession,
  getSession,
  getSessionQR,
  rotateQR,
  scanAttendance,
  manualMark,
  closeSession,
  getStudentAttendance,
  getTeacherSessions,
  correctAttendance,
};
