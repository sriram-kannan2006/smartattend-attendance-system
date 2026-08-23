const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    recipientRole: {
      type: String,
      enum: ['ADMIN', 'TEACHER', 'HOD', 'STUDENT', 'PARENT', 'WARDEN'],
    },
    type: {
      type: String,
      enum: [
        'ABSENCE_ALERT',
        'HOD_ATTENDANCE_SUMMARY',
        'LOW_ATTENDANCE_ALERT',
        'OD_NOTIFICATION',
        'GENERAL_NOTIFICATION',
        'ATTENDANCE_ABSENT',
        'ATTENDANCE_LOW',
        'OD_REQUEST',
        'OD_APPROVED',
        'OD_REJECTED',
        'FACE_REGISTERED',
        'SESSION_STARTED',
        'SESSION_CLOSED',
        'REPORT_GENERATED',
        'SYSTEM',
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    channel: {
      type: String,
      enum: ['IN_APP', 'EMAIL', 'SMS', 'PUSH', 'WHATSAPP'],
      default: 'IN_APP',
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
    readAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
notificationSchema.index({ recipientId: 1, isRead: 1 });
notificationSchema.index({ recipientId: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
