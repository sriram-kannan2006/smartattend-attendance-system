const mongoose = require('mongoose');

const academicYearSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Academic year name is required'],
    unique: true
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  isCurrent: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('AcademicYear', academicYearSchema);
