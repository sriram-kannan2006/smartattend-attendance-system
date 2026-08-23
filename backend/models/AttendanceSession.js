const mongoose = require('mongoose');

const attendanceSessionSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      required: true,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    hour: {
      type: Number,
      required: true,
      min: 1,
      max: 8,
    },
    startTime: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['CREATED', 'ACTIVE', 'CLOSED', 'EXPIRED', 'CANCELLED'],
      default: 'ACTIVE',
    },
    currentQrToken: {
      type: String,
    },
    currentQrExpiresAt: {
      type: Date,
    },
    tokenRotationInterval: {
      type: Number,
      default: 10, // seconds (reduced to 10s)
    },
    presentCount: {
      type: Number,
      default: 0,
    },
    odCount: {
      type: Number,
      default: 0,
    },
    absentCount: {
      type: Number,
      default: 0,
    },
    totalStudents: {
      type: Number,
      default: 0,
    },
    closedAt: {
      type: Date,
    },
    reportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Report',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
attendanceSessionSchema.index({ teacherId: 1, date: 1 });
attendanceSessionSchema.index({ classId: 1, date: 1, hour: 1 });
attendanceSessionSchema.index({ status: 1 });

module.exports = mongoose.model('AttendanceSession', attendanceSessionSchema);
