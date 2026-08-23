const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const {
  register,
  login,
  studentLogin,
  googleStudentLogin,
  getGoogleAuthUrl,
  googleCallback,
  changePassword,
  forgotPassword,
  getMe,
  logout,
} = require('../controllers/authController');

const router = express.Router();

// Validation rules
const registerValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email'),
  body('phone')
    .trim()
    .notEmpty().withMessage('Phone number is required'),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role')
    .notEmpty().withMessage('Role is required')
    .isIn(['ADMIN', 'TEACHER', 'STUDENT', 'PARENT', 'WARDEN'])
    .withMessage('Role must be ADMIN, TEACHER, STUDENT, PARENT, or WARDEN'),
];

const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email'),
  body('password')
    .notEmpty().withMessage('Password is required'),
];

const studentLoginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Institutional email is required')
    .isEmail().withMessage('Please provide a valid email'),
  body('password')
    .notEmpty().withMessage('Password is required'),
];

const googleLoginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Google email is required')
    .isEmail().withMessage('Please provide a valid email'),
];

const changePasswordValidation = [
  body('newPassword')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('confirmPassword')
    .notEmpty().withMessage('Confirm password is required'),
];

const forgotPasswordValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email'),
  body('newPassword')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('confirmPassword')
    .notEmpty().withMessage('Confirm password is required'),
];

// Routes
router.post('/register', authLimiter, registerValidation, validate, register);
router.post('/login', authLimiter, loginValidation, validate, login);
router.post('/student-login', authLimiter, studentLoginValidation, validate, studentLogin);
router.get('/google/url', getGoogleAuthUrl);
router.get('/google/callback', googleCallback);
router.post('/google', authLimiter, googleLoginValidation, validate, googleStudentLogin);
router.post('/change-password', protect, changePasswordValidation, validate, changePassword);
router.post('/forgot-password', authLimiter, forgotPasswordValidation, validate, forgotPassword);
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

module.exports = router;
