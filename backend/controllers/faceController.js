const faceService = require('../services/faceService');
const Student = require('../models/Student');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

exports.registerFace = asyncHandler(async (req, res, next) => {
  const { descriptor } = req.body;
  if (!descriptor || !Array.isArray(descriptor)) {
    return next(new AppError('Invalid descriptor', 400));
  }

  const student = await Student.findOne({ userId: req.user._id });
  if (!student) {
    return next(new AppError('Student profile not found', 404));
  }

  try {
    const result = await faceService.registerFace(student._id, descriptor);
    res.status(201).json({
      success: true,
      message: 'Face registered successfully',
      data: result,
    });
  } catch (error) {
    return next(new AppError(error.message, 400));
  }
});

exports.verifyFace = asyncHandler(async (req, res, next) => {
  const { descriptor } = req.body;
  if (!descriptor || !Array.isArray(descriptor)) {
    return next(new AppError('Invalid descriptor', 400));
  }

  const student = await Student.findOne({ userId: req.user._id });
  if (!student) {
    return next(new AppError('Student profile not found', 404));
  }

  const result = await faceService.verifyFace(student._id, descriptor);
  res.status(200).json({
    success: true,
    data: result,
  });
});

exports.getFaceStatus = asyncHandler(async (req, res, next) => {
  const student = await Student.findOne({ userId: req.user._id });
  if (!student) {
    return next(new AppError('Student profile not found', 404));
  }

  const result = await faceService.getFaceStatus(student._id);
  res.status(200).json({
    success: true,
    data: result,
  });
});

exports.reregisterFace = asyncHandler(async (req, res, next) => {
  const { descriptor } = req.body;
  if (!descriptor || !Array.isArray(descriptor)) {
    return next(new AppError('Invalid descriptor', 400));
  }

  const student = await Student.findOne({ userId: req.user._id });
  if (!student) {
    return next(new AppError('Student profile not found', 404));
  }

  try {
    const result = await faceService.reregisterFace(student._id, descriptor);
    res.status(200).json({
      success: true,
      message: 'Face re-registered successfully',
      data: result,
    });
  } catch (error) {
    return next(new AppError(error.message, 400));
  }
});

exports.revokeFace = asyncHandler(async (req, res, next) => {
  const { studentId } = req.params;
  await faceService.invalidateFace(studentId);
  res.status(200).json({ success: true, message: 'Face profile revoked successfully' });
});
