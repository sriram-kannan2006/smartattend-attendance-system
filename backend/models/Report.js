const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    reportId: {
      type: String,
      required: true,
      unique: true,
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
    },
    fileName: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      default: 'xlsx',
    },
    filePath: {
      type: String,
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    stats: {
      totalStudents: Number,
      present: Number,
      absent: Number,
      od: Number,
      percentage: Number,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
reportSchema.index({ sessionId: 1 });
reportSchema.index({ classId: 1, date: 1 });
reportSchema.index({ teacherId: 1, date: 1 });

module.exports = mongoose.model('Report', reportSchema);
