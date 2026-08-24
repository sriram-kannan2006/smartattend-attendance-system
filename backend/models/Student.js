const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    registerNumber: {
      type: String,
      required: [true, 'Register number is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Student name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      unique: true,
    },
    institutionalEmail: {
      type: String,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
    },
    section: {
      type: String,
      trim: true,
    },
    academicYear: {
      type: String,
      trim: true,
    },
    hostelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hostel',
    },
    faceRegistered: {
      type: Boolean,
      default: false,
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
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

// Indexes for efficient queries
studentSchema.index({ classId: 1 });
studentSchema.index({ departmentId: 1 });

module.exports = mongoose.model('Student', studentSchema);
