const mongoose = require('mongoose');

const notificationTemplateSchema = new mongoose.Schema(
  {
    templateKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    eventType: {
      type: String,
      enum: [
        'ABSENCE_ALERT',
        'HOD_ATTENDANCE_SUMMARY',
        'LOW_ATTENDANCE_ALERT',
        'OD_NOTIFICATION',
        'GENERAL_NOTIFICATION',
      ],
      required: true,
    },
    channel: {
      type: String,
      enum: ['IN_APP', 'EMAIL', 'WHATSAPP'],
      required: true,
    },
    recipientRole: {
      type: String,
      enum: ['STUDENT', 'PARENT', 'HOD', 'WARDEN', 'TEACHER', 'ADMIN'],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    body: {
      type: String,
      required: true,
    },
    supportedVariables: [
      {
        type: String,
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

notificationTemplateSchema.index({ eventType: 1, channel: 1, recipientRole: 1 });

module.exports = mongoose.model('NotificationTemplate', notificationTemplateSchema);
