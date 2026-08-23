const mongoose = require('mongoose');

const faceProfileSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: [true, 'Student ID is required'],
    unique: true
  },
  encryptedTemplate: {
    type: Buffer,
    required: [true, 'Encrypted template is required']
  },
  modelVersion: {
    type: String,
    default: '1.0'
  },
  status: {
    type: String,
    enum: ['REGISTERED', 'DISABLED', 'REQUIRES_REREGISTRATION'],
    default: 'REGISTERED'
  },
  registeredAt: {
    type: Date,
    default: Date.now
  },
  lastVerifiedAt: {
    type: Date
  },
  consentVersion: {
    type: String,
    default: '1.0'
  }
}, { timestamps: true });

module.exports = mongoose.model('FaceProfile', faceProfileSchema);
