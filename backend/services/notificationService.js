const Notification = require('../models/Notification');
const notificationEngine = require('./notifications/notificationEngine');

/**
 * Notification Service — Backward-compatible interface delegating to NotificationEngine.
 * Handles in-app notifications and queries for user dashboards.
 */

/**
 * Create an in-app notification directly.
 * @param {Object} notifData
 */
const createNotification = async (notifData) => {
  try {
    const notification = await Notification.create(notifData);
    return notification;
  } catch (error) {
    console.error('Notification creation error:', error.message);
    return null;
  }
};

/**
 * Send absent notifications to student, parent, and warden via NotificationEngine.
 * @param {Object} params - { studentId, subjectName, hour, date, className }
 */
const sendAbsentNotifications = async (params) => {
  try {
    const { studentId, subjectName, hour, date, className } = params;
    await notificationEngine.trigger({
      type: 'ABSENCE_ALERT',
      channels: ['IN_APP', 'WHATSAPP'],
      studentId,
      payload: {
        studentId,
        subjectName,
        hour,
        date,
        className,
      },
    });
  } catch (error) {
    console.error('Absent notification error:', error.message);
  }
};

/**
 * Send batch absent notifications.
 * @param {Array} absentStudentIds
 * @param {Object} sessionInfo
 */
const sendBatchAbsentNotifications = async (absentStudentIds, sessionInfo) => {
  for (const studentId of absentStudentIds) {
    await sendAbsentNotifications({
      studentId,
      ...sessionInfo,
    });
  }
};

/**
 * Get notifications for a user (Inbox).
 * @param {string} userId
 * @param {number} limit
 * @param {number} page
 */
const getNotifications = async (userId, limit = 20, page = 1) => {
  const skip = (page - 1) * limit;

  const [notifications, unreadCount, totalCount] = await Promise.all([
    Notification.find({ recipientId: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Notification.countDocuments({ recipientId: userId, isRead: false }),
    Notification.countDocuments({ recipientId: userId }),
  ]);

  return {
    notifications,
    unreadCount,
    totalCount,
    page,
    totalPages: Math.ceil(totalCount / limit),
  };
};

/**
 * Mark a notification as read.
 * @param {string} notificationId
 * @param {string} userId
 */
const markAsRead = async (notificationId, userId) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, recipientId: userId },
    { isRead: true, readAt: new Date() },
    { new: true }
  );
  return notification;
};

/**
 * Mark all notifications as read for a user.
 * @param {string} userId
 */
const markAllAsRead = async (userId) => {
  await Notification.updateMany(
    { recipientId: userId, isRead: false },
    { isRead: true, readAt: new Date() }
  );
};

module.exports = {
  createNotification,
  sendAbsentNotifications,
  sendBatchAbsentNotifications,
  getNotifications,
  markAsRead,
  markAllAsRead,
  engine: notificationEngine,
};
