const asyncHandler = require('../utils/asyncHandler');
const ODRecord = require('../models/ODRecord');
const Student = require('../models/Student');
const AppError = require('../utils/AppError');
const { logAudit } = require('../utils/auditLogger');

/**
 * @desc    Create OD request
 * @route   POST /api/od
 * @access  Private (STUDENT)
 */
const createODRequest = asyncHandler(async (req, res) => {
  const { date, startHour, endHour, reason, event } = req.body;

  const student = await Student.findOne({ userId: req.user._id });
  if (!student) {
    throw new AppError('Student profile not found.', 404);
  }

  // Check for duplicate OD request
  const existing = await ODRecord.findOne({
    studentId: student._id,
    date: new Date(date),
    startHour,
    endHour,
    status: { $in: ['PENDING', 'APPROVED'] },
  });

  if (existing) {
    throw new AppError('An OD request already exists for this date and hours.', 400);
  }

  const odRecord = await ODRecord.create({
    studentId: student._id,
    date: new Date(date),
    startHour,
    endHour,
    reason,
    event: event || undefined,
  });

  await logAudit(req.user._id, 'OD_REQUEST', 'ODRecord', odRecord._id, {
    date, startHour, endHour, reason,
  }, req);

  res.status(201).json({
    success: true,
    message: 'OD request submitted',
    data: odRecord,
  });
});

/**
 * @desc    Get OD requests (filtered by role)
 * @route   GET /api/od
 * @access  Private
 */
const getODRequests = asyncHandler(async (req, res) => {
  const { status, date, page = 1, limit = 20 } = req.query;
  const query = {};

  if (req.user.role === 'STUDENT') {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) throw new AppError('Student not found.', 404);
    query.studentId = student._id;
  }

  if (status) query.status = status;
  if (date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    query.date = { $gte: startOfDay, $lte: endOfDay };
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [records, total] = await Promise.all([
    ODRecord.find(query)
      .populate('studentId', 'registerNumber name classId')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    ODRecord.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    count: records.length,
    total,
    page: parseInt(page),
    totalPages: Math.ceil(total / parseInt(limit)),
    data: records,
  });
});

/**
 * @desc    Update OD request (approve/reject)
 * @route   PUT /api/od/:id
 * @access  Private (TEACHER, ADMIN)
 */
const updateODRequest = asyncHandler(async (req, res) => {
  const { status, remarks } = req.body;

  const odRecord = await ODRecord.findById(req.params.id);
  if (!odRecord) {
    throw new AppError('OD request not found.', 404);
  }

  if (odRecord.status !== 'PENDING') {
    throw new AppError('This OD request has already been processed.', 400);
  }

  odRecord.status = status;
  odRecord.approvedBy = req.user._id;
  odRecord.decidedAt = new Date();
  odRecord.remarks = remarks || undefined;
  await odRecord.save();

  await logAudit(req.user._id, `OD_${status}`, 'ODRecord', odRecord._id, {
    status, remarks,
  }, req);

  res.status(200).json({
    success: true,
    message: `OD request ${status.toLowerCase()}`,
    data: odRecord,
  });
});

module.exports = { createODRequest, getODRequests, updateODRequest };
