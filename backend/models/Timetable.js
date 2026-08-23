const mongoose = require('mongoose');

const timetableSchema = new mongoose.Schema({
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: [true, 'Class ID is required']
  },
  dayOfWeek: {
    type: Number,
    required: [true, 'Day of week is required'],
    min: 1,
    max: 6
  },
  hour: {
    type: Number,
    required: [true, 'Hour is required'],
    min: 1,
    max: 8
  },
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: [true, 'Subject ID is required']
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: [true, 'Teacher ID is required']
  },
  startTime: {
    type: String
  },
  endTime: {
    type: String
  },
  academicYear: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

timetableSchema.index({ classId: 1, dayOfWeek: 1, hour: 1, academicYear: 1 }, { unique: true });

module.exports = mongoose.model('Timetable', timetableSchema);
