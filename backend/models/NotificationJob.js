const mongoose = require('mongoose');

const notificationJobSchema = new mongoose.Schema(
  {
    jobId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        'ABSENCE_ALERT',
        'HOD_ATTENDANCE_SUMMARY',
        'LOW_ATTENDANCE_ALERT',
        'OD_NOTIFICATION',
        'GENERAL_NOTIFICATION',
      ],
      required: true,
      index: true,
    },
    channel: {
      type: String,
      enum: ['IN_APP', 'EMAIL', 'WHATSAPP'],
      required: true,
      index: true,
    },
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    recipientRole: {
      type: String,
      enum: ['STUDENT', 'PARENT', 'TEACHER', 'HOD', 'WARDEN', 'ADMIN'],
    },
    recipientAddress: {
      type: String,
      trim: true,
    },
    templateId: {
      type: String,
      default: 'default',
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    status: {
      type: String,
      enum: [
        'QUEUED',
        'PROCESSING',
        'SENT',
        'DELIVERED',
        'FAILED',
        'RETRYING',
        'SIMULATED',
      ],
      default: 'QUEUED',
      index: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    maxAttempts: {
      type: Number,
      default: 3,
    },
    error: {
      type: mongoose.Schema.Types.Mixed,
    },
    providerResponse: {
      type: mongoose.Schema.Types.Mixed,
    },
    scheduledAt: {
      type: Date,
      default: Date.now,
    },
    processingStartedAt: {
      type: Date,
    },
    sentAt: {
      type: Date,
    },
    deliveredAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound Indexes for queue querying and historical lookups
notificationJobSchema.index({ status: 1, scheduledAt: 1 });
notificationJobSchema.index({ recipientId: 1, createdAt: -1 });
notificationJobSchema.index({ type: 1, channel: 1, createdAt: -1 });

module.exports = mongoose.model('NotificationJob', notificationJobSchema);
