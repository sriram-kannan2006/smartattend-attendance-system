const mongoose = require('mongoose');

const faceVerificationEventSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: [true, 'Student ID is required']
  },
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AttendanceSession'
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  result: {
    type: String,
    enum: ['SUCCESS', 'FAILED'],
    required: [true, 'Result is required']
  },
  reasonCode: {
    type: String
  },
  authenticationId: {
    type: String
  },
  expiresAt: {
    type: Date
  },
  used: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

faceVerificationEventSchema.index({ studentId: 1 });
faceVerificationEventSchema.index({ authenticationId: 1 }, { unique: true, sparse: true });
faceVerificationEventSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('FaceVerificationEvent', faceVerificationEventSchema);
