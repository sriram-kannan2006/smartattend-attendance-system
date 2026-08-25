const express = require('express');
const { body, param, query } = require('express-validator');
const validate = require('../middleware/validate');
const { protect, authorize } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');
const ctrl = require('../controllers/attendanceController');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Session management (Teacher)
router.post(
  '/session',
  authorize('TEACHER'),
  [
    body('classId').optional(),
    body('subjectId').optional(),
    body('hour').optional().isInt({ min: 1, max: 8 }).withMessage('Hour must be between 1 and 8'),
  ],
  validate,
  ctrl.createSession
);

router.get(
  '/session/:id',
  authorize('TEACHER', 'ADMIN'),
  ctrl.getSession
);

router.get(
  '/session/:id/qr',
  authorize('TEACHER'),
  ctrl.getSessionQR
);

router.post(
  '/session/:id/rotate-qr',
  authorize('TEACHER'),
  ctrl.rotateQR
);

router.post(
  '/session/:id/manual-mark',
  authorize('TEACHER', 'ADMIN'),
  [
    body('studentId').notEmpty().withMessage('Student ID is required'),
    body('status').optional().isIn(['PRESENT', 'ABSENT', 'OD', 'LATE', 'EXCUSED']).withMessage('Invalid status'),
    body('reason').optional().isString(),
  ],
  validate,
  ctrl.manualMark
);

router.post(
  '/session/:id/close',
  authorize('TEACHER', 'ADMIN'),
  ctrl.closeSession
);

// Student attendance scan
router.post(
  '/scan',
  authorize('STUDENT'),
  apiLimiter,
  [
    body('sessionId').notEmpty().withMessage('Session ID is required'),
    body('qrToken').notEmpty().withMessage('QR token is required'),
    body('faceAuthId').notEmpty().withMessage('Face authentication ID is required'),
  ],
  validate,
  ctrl.scanAttendance
);

// Student attendance history
router.get(
  '/student/me',
  authorize('STUDENT'),
  ctrl.getStudentAttendance
);

router.get(
  '/student/:id',
  authorize('TEACHER', 'ADMIN', 'PARENT', 'WARDEN'),
  ctrl.getStudentAttendance
);

// Teacher sessions
router.get(
  '/teacher/sessions',
  authorize('TEACHER'),
  ctrl.getTeacherSessions
);

// Attendance correction
router.put(
  '/:id/correct',
  authorize('TEACHER', 'ADMIN'),
  [
    body('status').isIn(['PRESENT', 'ABSENT', 'OD', 'LATE', 'EXCUSED']).withMessage('Invalid status'),
    body('reason').notEmpty().withMessage('Correction reason is required'),
  ],
  validate,
  ctrl.correctAttendance
);

module.exports = router;
