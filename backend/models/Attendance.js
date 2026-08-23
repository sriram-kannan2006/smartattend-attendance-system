const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AttendanceSession',
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
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
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
    status: {
      type: String,
      enum: ['PRESENT', 'ABSENT', 'OD', 'LATE', 'EXCUSED'],
      required: true,
    },
    scannedAt: {
      type: Date,
    },
    faceVerificationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FaceVerificationEvent',
    },
    qrTokenUsed: {
      type: String,
    },
    location: {
      latitude: Number,
      longitude: Number,
    },
    deviceInfo: {
      userAgent: String,
      platform: String,
    },
    // For corrections
    correctedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    correctionReason: {
      type: String,
    },
    previousStatus: {
      type: String,
      enum: ['PRESENT', 'ABSENT', 'OD', 'LATE', 'EXCUSED'],
    },
    correctedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index: one attendance record per student per session
attendanceSchema.index({ studentId: 1, sessionId: 1 }, { unique: true });
attendanceSchema.index({ classId: 1, date: 1, hour: 1 });
attendanceSchema.index({ studentId: 1, date: 1 });
attendanceSchema.index({ sessionId: 1, status: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
