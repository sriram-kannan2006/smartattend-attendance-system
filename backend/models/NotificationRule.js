const mongoose = require('mongoose');

const notificationRuleSchema = new mongoose.Schema(
  {
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
    recipientRole: {
      type: String,
      enum: ['STUDENT', 'PARENT', 'HOD', 'WARDEN', 'TEACHER', 'ADMIN'],
      required: true,
    },
    channels: {
      inApp: { type: Boolean, default: true },
      email: { type: Boolean, default: false },
      whatsapp: { type: Boolean, default: false },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

notificationRuleSchema.index({ eventType: 1, recipientRole: 1 }, { unique: true });

module.exports = mongoose.model('NotificationRule', notificationRuleSchema);
