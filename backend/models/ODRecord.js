const mongoose = require('mongoose');

const odRecordSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    startHour: {
      type: Number,
      required: true,
      min: 1,
      max: 8,
    },
    endHour: {
      type: Number,
      required: true,
      min: 1,
      max: 8,
    },
    reason: {
      type: String,
      required: [true, 'Reason is required'],
      trim: true,
    },
    event: {
      type: String,
      trim: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'],
      default: 'PENDING',
    },
    appliedAt: {
      type: Date,
      default: Date.now,
    },
    decidedAt: {
      type: Date,
    },
    remarks: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
odRecordSchema.index({ studentId: 1, date: 1 });
odRecordSchema.index({ status: 1 });

module.exports = mongoose.model('ODRecord', odRecordSchema);
