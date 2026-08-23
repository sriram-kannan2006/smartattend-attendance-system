const asyncHandler = require('../utils/asyncHandler');
const notificationService = require('../services/notificationService');
const notificationEngine = require('../services/notifications/notificationEngine');
const templateService = require('../services/notifications/templateService');
const NotificationJob = require('../models/NotificationJob');
const NotificationRule = require('../models/NotificationRule');
const NotificationTemplate = require('../models/NotificationTemplate');
const Notification = require('../models/Notification');
const Student = require('../models/Student');
const Parent = require('../models/Parent');
const Department = require('../models/Department');
const Teacher = require('../models/Teacher');
const AppError = require('../utils/AppError');

/**
 * @desc    Get in-app notifications for current logged-in user (with strict Parent privacy)
 * @route   GET /api/notifications
 * @access  Private
 */
const getNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const user = req.user;

  const query = { recipientId: user._id };

  // Strict Parent Privacy: Only view notifications relating to their linked wards
  if (user.role === 'PARENT') {
    const parentDoc = await Parent.findOne({ userId: user._id });
    if (parentDoc && parentDoc.studentIds && parentDoc.studentIds.length > 0) {
      query.$or = [
        { recipientId: user._id },
        { 'data.studentId': { $in: parentDoc.studentIds } },
      ];
      delete query.recipientId;
    }
  }

  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const [notifications, unreadCount, totalCount] = await Promise.all([
    Notification.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit, 10)),
    Notification.countDocuments({ ...query, isRead: false }),
    Notification.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    data: {
      notifications,
      unreadCount,
      totalCount,
      page: parseInt(page, 10),
      totalPages: Math.ceil(totalCount / parseInt(limit, 10)),
    },
  });
});

/**
 * @desc    Mark notification as read
 * @route   PUT /api/notifications/:id/read
 * @access  Private
 */
const markAsRead = asyncHandler(async (req, res) => {
  const notification = await notificationService.markAsRead(req.params.id, req.user._id);

  res.status(200).json({
    success: true,
    data: notification,
  });
});

/**
 * @desc    Mark all notifications as read
 * @route   PUT /api/notifications/read-all
 * @access  Private
 */
const markAllAsRead = asyncHandler(async (req, res) => {
  await notificationService.markAllAsRead(req.user._id);

  res.status(200).json({
    success: true,
    message: 'All notifications marked as read',
  });
});

/**
 * @desc    Get notification stats & channel status for Admin
 * @route   GET /api/notifications/stats
 * @access  Private (ADMIN)
 */
const getNotificationStats = asyncHandler(async (req, res) => {
  const stats = await notificationEngine.getStats();

  res.status(200).json({
    success: true,
    data: stats,
  });
});

/**
 * @desc    Get notification rules
 * @route   GET /api/notifications/rules
 * @access  Private (ADMIN)
 */
const getNotificationRules = asyncHandler(async (req, res) => {
  const rules = await notificationEngine.getRules();

  res.status(200).json({
    success: true,
    data: rules,
  });
});

/**
 * @desc    Update notification rule
 * @route   PUT /api/notifications/rules/:id
 * @access  Private (ADMIN)
 */
const updateNotificationRule = asyncHandler(async (req, res) => {
  const { channels, isActive } = req.body;
  const rule = await notificationEngine.updateRule(req.params.id, { channels, isActive });

  res.status(200).json({
    success: true,
    message: 'Notification rule updated successfully',
    data: rule,
  });
});

/**
 * @desc    Get all notification templates
 * @route   GET /api/notifications/templates
 * @access  Private (ADMIN)
 */
const getTemplates = asyncHandler(async (req, res) => {
  await templateService.seedDefaultTemplates();
  const templates = await NotificationTemplate.find().sort({ eventType: 1, channel: 1 });

  res.status(200).json({
    success: true,
    supportedVariables: templateService.supportedVariables,
    data: templates,
  });
});

/**
 * @desc    Update notification template with variable validation
 * @route   PUT /api/notifications/templates/:id
 * @access  Private (ADMIN)
 */
const updateTemplate = asyncHandler(async (req, res) => {
  const { title, body, isActive } = req.body;

  // Validate variables
  const validation = templateService.validateVariables(body);
  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      message: `Invalid template variables detected: {{${validation.invalidVariables.join('}}, {{')}}}`,
    });
  }

  const template = await NotificationTemplate.findByIdAndUpdate(
    req.params.id,
    { title, body, isActive },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    message: 'Template updated successfully',
    data: template,
  });
});

/**
 * @desc    Preview notification template
 * @route   POST /api/notifications/templates/preview
 * @access  Private (ADMIN)
 */
const previewTemplate = asyncHandler(async (req, res) => {
  const { title, body, payload } = req.body;
  const result = templateService.preview(body, title, payload);

  res.status(200).json({
    success: true,
    data: result,
  });
});

/**
 * @desc    Get parent notification profiles list (Admin)
 * @route   GET /api/notifications/parents
 * @access  Private (ADMIN)
 */
const getParentNotificationProfiles = asyncHandler(async (req, res) => {
  const { search, page = 1, limit = 20 } = req.query;

  const studentQuery = {};
  if (search) {
    studentQuery.$or = [
      { name: { $regex: search, $options: 'i' } },
      { registerNumber: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

  const [students, total] = await Promise.all([
    Student.find(studentQuery)
      .populate('classId', 'name')
      .populate('parentId')
      .sort({ registerNumber: 1 })
      .skip(skip)
      .limit(parseInt(limit, 10)),
    Student.countDocuments(studentQuery),
  ]);

  // Enrich with parent details
  const enriched = await Promise.all(
    students.map(async (st) => {
      let parent = await Parent.findOne({ studentIds: st._id });
      if (!parent && st.parentId) {
        parent = await Parent.findOne({ userId: st.parentId });
      }

      return {
        studentId: st._id,
        studentName: st.name,
        registerNumber: st.registerNumber,
        className: st.classId?.name || 'ECE III Year - Section D',
        parentId: parent?._id || null,
        parentName: parent?.name || `Parent of ${st.name}`,
        phone: parent?.phone || st.phone || '',
        whatsappNumber: parent?.whatsappNumber || parent?.phone || st.phone || '',
        whatsappOptIn: parent?.whatsappOptIn !== false,
        email: parent?.email || '',
        notificationPreferences: parent?.notificationPreferences || { inApp: true, email: true, whatsapp: true },
        whatsappStatus: 'SIMULATION MODE',
      };
    })
  );

  res.status(200).json({
    success: true,
    data: enriched,
    total,
    page: parseInt(page, 10),
    totalPages: Math.ceil(total / parseInt(limit, 10)),
  });
});

/**
 * @desc    Update parent contact and notification preferences (Admin)
 * @route   PUT /api/notifications/parents/:studentId
 * @access  Private (ADMIN)
 */
const updateParentNotificationProfile = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const { parentName, phone, whatsappNumber, whatsappOptIn, email, notificationPreferences } = req.body;

  const student = await Student.findById(studentId);
  if (!student) {
    throw new AppError('Student not found', 404);
  }

  let parent = await Parent.findOne({ studentIds: student._id });
  if (!parent && student.parentId) {
    parent = await Parent.findOne({ userId: student.parentId });
  }

  if (parent) {
    if (parentName) parent.name = parentName;
    if (phone) parent.phone = phone;
    if (whatsappNumber !== undefined) parent.whatsappNumber = whatsappNumber;
    if (whatsappOptIn !== undefined) parent.whatsappOptIn = whatsappOptIn;
    if (email) parent.email = email;
    if (notificationPreferences) parent.notificationPreferences = notificationPreferences;
    await parent.save();
  } else {
    // Create new parent entry if none existed
    parent = await Parent.create({
      userId: student.userId,
      name: parentName || `Parent of ${student.name}`,
      email: email || `${student.registerNumber.toLowerCase()}.parent@kongu.edu`,
      phone: phone || student.phone,
      whatsappNumber: whatsappNumber || phone || student.phone,
      whatsappOptIn: whatsappOptIn !== false,
      notificationPreferences: notificationPreferences || { inApp: true, email: true, whatsapp: true },
      studentIds: [student._id],
    });
  }

  res.status(200).json({
    success: true,
    message: 'Parent notification settings updated successfully',
    data: parent,
  });
});

/**
 * @desc    Get departments and assigned HODs (Admin)
 * @route   GET /api/notifications/hods
 * @access  Private (ADMIN)
 */
const getDepartmentHODs = asyncHandler(async (req, res) => {
  const departments = await Department.find().populate('hodId', 'name email phone');
  const teachers = await Teacher.find({ isActive: true }).select('name email phone departmentId');

  const formatted = departments.map((dept) => {
    return {
      departmentId: dept._id,
      name: dept.name,
      code: dept.code,
      hodId: dept.hodId?._id || null,
      hodName: dept.hodId?.name || 'Unassigned',
      hodEmail: dept.hodId?.email || '',
      hodPhone: dept.hodId?.phone || '',
      status: dept.isActive ? 'Active' : 'Inactive',
    };
  });

  res.status(200).json({
    success: true,
    data: {
      departments: formatted,
      availableTeachers: teachers,
    },
  });
});

/**
 * @desc    Assign HOD to a department (Admin)
 * @route   PUT /api/notifications/hods/:departmentId
 * @access  Private (ADMIN)
 */
const assignDepartmentHOD = asyncHandler(async (req, res) => {
  const { departmentId } = req.params;
  const { teacherId } = req.body;

  const department = await Department.findById(departmentId);
  if (!department) {
    throw new AppError('Department not found', 404);
  }

  if (teacherId) {
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      throw new AppError('Teacher not found', 404);
    }
    department.hodId = teacher.userId;
  } else {
    department.hodId = null;
  }

  await department.save();
  await department.populate('hodId', 'name email phone');

  res.status(200).json({
    success: true,
    message: `HOD assignment updated for ${department.name}`,
    data: department,
  });
});

/**
 * @desc    Trigger a test notification (Development / Admin Test Endpoint)
 * @route   POST /api/notifications/test
 * @access  Private (ADMIN)
 */
const testNotification = asyncHandler(async (req, res) => {
  const { channel = 'WHATSAPP', type = 'ABSENCE_ALERT', recipientAddress, payload = {} } = req.body;

  const testPayload = {
    studentName: payload.studentName || 'SARAN K N',
    registerNumber: payload.registerNumber || '24ECR177',
    subjectName: payload.subjectName || 'Digital Signal Processing',
    hour: payload.hour || 1,
    date: payload.date || new Date().toISOString(),
    className: payload.className || 'ECE III Year - Section D',
    department: 'ECE',
    ...payload,
  };

  const jobs = await notificationEngine.trigger({
    type,
    channels: Array.isArray(channel) ? channel : [channel],
    recipientId: req.user._id,
    recipientRole: req.user.role,
    recipientAddress: recipientAddress || req.user.phone || '+918300380302',
    payload: testPayload,
  });

  res.status(200).json({
    success: true,
    message: `Test notification triggered for channel: ${Array.isArray(channel) ? channel.join(', ') : channel}`,
    jobsCount: jobs.length,
    jobs,
  });
});

/**
 * @desc    Get notification jobs audit list
 * @route   GET /api/notifications/jobs
 * @access  Private (ADMIN)
 */
const getNotificationJobs = asyncHandler(async (req, res) => {
  const { status, channel, type, search, page = 1, limit = 20 } = req.query;

  const result = await notificationEngine.getJobs(
    { status, channel, type, search },
    parseInt(page, 10),
    parseInt(limit, 10)
  );

  res.status(200).json({
    success: true,
    data: result,
  });
});

/**
 * @desc    Get single notification job details (Admin)
 * @route   GET /api/notifications/jobs/:id
 * @access  Private (ADMIN)
 */
const getNotificationJobDetail = asyncHandler(async (req, res) => {
  const job = await NotificationJob.findById(req.params.id).populate('recipientId', 'name email role');
  if (!job) {
    throw new AppError('Notification job not found', 404);
  }

  // Mask sensitive address if phone number
  const maskedAddress = job.recipientAddress && job.recipientAddress.length > 6
    ? job.recipientAddress.slice(0, job.recipientAddress.length - 4).replace(/\d/g, 'X') + job.recipientAddress.slice(-4)
    : job.recipientAddress;

  res.status(200).json({
    success: true,
    data: {
      ...job.toObject(),
      recipientAddress: maskedAddress,
    },
  });
});

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getNotificationStats,
  getNotificationRules,
  updateNotificationRule,
  getTemplates,
  updateTemplate,
  previewTemplate,
  getParentNotificationProfiles,
  updateParentNotificationProfile,
  getDepartmentHODs,
  assignDepartmentHOD,
  testNotification,
  getNotificationJobs,
  getNotificationJobDetail,
};
