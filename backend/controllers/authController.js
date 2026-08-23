const asyncHandler = require('../utils/asyncHandler');
const authService = require('../services/authService');

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = asyncHandler(async (req, res) => {
  const result = await authService.registerUser(req.body, req);

  res.status(201).json({
    success: true,
    message: 'Registration successful',
    data: result,
  });
});

/**
 * @desc    General Login (Faculty, Admin, Parents)
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.loginUser(email, password, req);

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: result,
  });
});

/**
 * @desc    Dedicated Institutional Student Login (Email + Password)
 * @route   POST /api/auth/student-login
 * @access  Public
 */
const studentLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.studentLogin(email, password, req);

  res.status(200).json({
    success: true,
    message: 'Student login successful',
    data: result,
  });
});

/**
 * @desc    Get Google OAuth 2.0 Authorization URL
 * @route   GET /api/auth/google/url
 * @access  Public
 */
const getGoogleAuthUrl = asyncHandler(async (req, res) => {
  const role = req.query.role || 'STUDENT';
  try {
    const url = authService.getGoogleAuthUrl(role);
    res.status(200).json({
      success: true,
      url,
      configured: true,
    });
  } catch (err) {
    res.status(200).json({
      success: false,
      configured: false,
      message: err.message,
    });
  }
});

/**
 * @desc    Google OAuth 2.0 Callback
 * @route   GET /api/auth/google/callback
 * @access  Public
 */
const googleCallback = asyncHandler(async (req, res) => {
  const { code, state, error } = req.query;
  const config = require('../config');
  const frontendUrl = config.frontendUrl || 'http://localhost:5173';

  if (error) {
    return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent(error)}`);
  }

  try {
    const result = await authService.handleGoogleCallback(code, state, req);
    const token = result.token;
    const role = result.role;
    const faceRegistered = result.faceRegistered;

    res.redirect(
      `${frontendUrl}/auth/callback?token=${token}&role=${role}&faceRegistered=${faceRegistered}`
    );
  } catch (err) {
    console.error('Google OAuth callback error:', err);
    res.redirect(
      `${frontendUrl}/login?error=${encodeURIComponent(err.message || 'Google authentication failed')}`
    );
  }
});

/**
 * @desc    Institutional Google Login (Students & Staff)
 * @route   POST /api/auth/google
 * @access  Public
 */
const googleStudentLogin = asyncHandler(async (req, res) => {
  const { email, googleToken, portalRole } = req.body;
  const result = await authService.googleStudentLogin(email, googleToken, portalRole, req);

  res.status(200).json({
    success: true,
    message: 'Google authentication successful',
    data: result,
  });
});

/**
 * @desc    First-Time Password Change / Account Security
 * @route   POST /api/auth/change-password
 * @access  Private (Authenticated Student / User)
 */
const changePassword = asyncHandler(async (req, res) => {
  const { newPassword, confirmPassword } = req.body;
  const result = await authService.changePassword(
    req.user._id,
    newPassword,
    confirmPassword,
    req
  );

  res.status(200).json({
    success: true,
    message: result.message,
    data: result,
  });
});

/**
 * @desc    Forgot Password / Direct Password Reset
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
const forgotPassword = asyncHandler(async (req, res) => {
  const { email, newPassword, confirmPassword } = req.body;
  const result = await authService.forgotPassword(email, newPassword, confirmPassword, req);

  res.status(200).json({
    success: true,
    message: result.message,
  });
});

/**
 * @desc    Get current logged in user
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getCurrentUser(req.user._id);

  res.status(200).json({
    success: true,
    data: { user },
  });
});

/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logout = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
});

module.exports = {
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
};
