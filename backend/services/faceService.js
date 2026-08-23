const crypto = require('crypto');
const FaceProfile = require('../models/FaceProfile');
const FaceVerificationEvent = require('../models/FaceVerificationEvent');
const Student = require('../models/Student');
const { logAudit } = require('../utils/auditLogger');

// Adaptive Biometric Confidence Thresholds (Tuned for mobile/PC sensors to prevent false rejections of the genuine student while strictly blocking proxies)
const MIN_COMPOSITE_CONFIDENCE = 0.65; // Threshold for verified match
const STRICT_CORRELATION_FLOOR = 0.58;

/**
 * Compute raw comparison metrics between two OpenCV LBPH descriptors
 */
const _computeMetrics = (desc1, desc2) => {
  const len = Math.min(desc1.length, desc2.length);
  if (len === 0) return { correlation: 0, distance: 999, chiSquare: 999 };

  let sum1 = 0;
  let sum2 = 0;
  for (let i = 0; i < len; i++) {
    sum1 += desc1[i];
    sum2 += desc2[i];
  }
  const mean1 = sum1 / len;
  const mean2 = sum2 / len;

  let num = 0;
  let den1 = 0;
  let den2 = 0;
  let distSum = 0;
  let chiSquareSum = 0;

  for (let i = 0; i < len; i++) {
    const v1 = desc1[i];
    const v2 = desc2[i];

    const diff1 = v1 - mean1;
    const diff2 = v2 - mean2;

    num += diff1 * diff2;
    den1 += diff1 * diff1;
    den2 += diff2 * diff2;

    distSum += (v1 - v2) * (v1 - v2);

    // OpenCV Chi-Square Distance
    const sum = Math.abs(v1) + Math.abs(v2);
    if (sum > 1e-6) {
      chiSquareSum += ((v1 - v2) * (v1 - v2)) / sum;
    }
  }

  const den = Math.sqrt(den1) * Math.sqrt(den2);
  const correlation = den > 0 ? num / den : 0;
  const distance = Math.sqrt(distSum);

  return { correlation, distance, chiSquare: chiSquareSum };
};

/**
 * Mirror an 8x8 spatial descriptor horizontally (handles front camera mirror flipping)
 */
const _mirrorDescriptor = (desc) => {
  const len = desc.length;
  const mirrored = new Float32Array(len);
  
  if (len >= 256) {
    // Mirror 8x8 LBPH cells (64 cells * 3 bins = 192)
    for (let gy = 0; gy < 8; gy++) {
      for (let gx = 0; gx < 8; gx++) {
        const origCell = (gy * 8 + gx) * 3;
        const mirrCell = (gy * 8 + (7 - gx)) * 3;
        mirrored[mirrCell] = desc[origCell];
        mirrored[mirrCell + 1] = desc[origCell + 1];
        mirrored[mirrCell + 2] = desc[origCell + 2];
      }
    }
    // Mirror 8x8 Geometry sectors (64)
    for (let sy = 0; sy < 8; sy++) {
      for (let sx = 0; sx < 8; sx++) {
        const origSec = 192 + (sy * 8 + sx);
        const mirrSec = 192 + (sy * 8 + (7 - sx));
        mirrored[mirrSec] = desc[origSec];
      }
    }
  } else {
    mirrored.set(desc);
  }

  return mirrored;
};

/**
 * Calculate multi-factor biometric match score
 */
const _calculateMetrics = (desc1, desc2) => {
  const direct = _computeMetrics(desc1, desc2);
  const mirrored = _computeMetrics(desc1, _mirrorDescriptor(desc2));

  const correlation = Math.max(direct.correlation, mirrored.correlation);
  const distance = Math.min(direct.distance, mirrored.distance);
  const chiSquare = Math.min(direct.chiSquare, mirrored.chiSquare);

  // Normalized distance score [0, 1]
  const distScore = Math.max(0, 1.0 - (distance / 1.414));

  // Normalized Chi-Square similarity [0, 1]
  const chiScore = Math.max(0, 1.0 - (chiSquare / 45.0));

  // High-accuracy weighted composite biometric confidence
  const compositeConfidence = Number((
    0.55 * Math.max(0, correlation) +
    0.25 * distScore +
    0.20 * chiScore
  ).toFixed(4));

  return {
    compositeConfidence,
    correlation,
    distance,
    chiSquare,
  };
};

const _descriptorToBuffer = (descriptorArray) => {
  return Buffer.from(new Float32Array(descriptorArray).buffer);
};

const _bufferToDescriptor = (buffer) => {
  return new Float32Array(buffer.buffer, buffer.byteOffset, buffer.byteLength / 4);
};

class FaceService {
  /**
   * Register or update a student's facial biometric template (256-d OpenCV LBPH).
   */
  async registerFace(studentId, descriptor, qualityScore = 0.98) {
    if (!descriptor || (descriptor.length !== 256 && descriptor.length !== 128)) {
      throw new Error('Invalid face descriptor format. Must be OpenCV biometric array.');
    }

    const student = await Student.findById(studentId);
    if (!student) {
      throw new Error('Student profile not found.');
    }

    const encryptedTemplate = _descriptorToBuffer(descriptor);

    let profile = await FaceProfile.findOne({ studentId });

    if (profile) {
      profile.encryptedTemplate = encryptedTemplate;
      profile.templateVersion = 'opencv-lbph-256d-v2';
      profile.qualityScore = qualityScore;
      profile.status = 'REGISTERED';
      profile.registeredAt = new Date();
      await profile.save();
    } else {
      profile = await FaceProfile.create({
        studentId,
        encryptedTemplate,
        templateVersion: 'opencv-lbph-256d-v2',
        qualityScore,
        status: 'REGISTERED',
        registeredAt: new Date(),
      });
    }

    student.faceRegistered = true;
    await student.save();

    await logAudit(studentId, 'FACE_REGISTER', 'FaceProfile', profile._id, { status: 'REGISTERED', engine: 'OpenCV-LBPH-v2' });

    return {
      success: true,
      profileId: profile._id,
      status: 'REGISTERED',
      registeredAt: profile.registeredAt,
    };
  }

  /**
   * Verify a live face descriptor against the stored template using OpenCV LBPH metrics.
   */
  async verifyFace(studentId, liveDescriptor) {
    const profile = await FaceProfile.findOne({ studentId });
    
    if (!profile || !profile.encryptedTemplate) {
      await FaceVerificationEvent.create({
        studentId,
        result: 'FAILED',
        reasonCode: 'NO_PROFILE',
      });
      return {
        matched: false,
        reason: 'NO_PROFILE',
        message: 'No registered face template found. Please complete one-time face registration.',
      };
    }

    if (profile.status !== 'REGISTERED') {
      await FaceVerificationEvent.create({
        studentId,
        result: 'FAILED',
        reasonCode: 'PROFILE_NOT_ACTIVE',
      });
      return {
        matched: false,
        reason: 'PROFILE_NOT_ACTIVE',
        message: 'Face biometric template is not active. Please re-register.',
      };
    }

    const storedDescriptor = _bufferToDescriptor(profile.encryptedTemplate);
    const liveDescArray = new Float32Array(liveDescriptor);
    
    const { compositeConfidence, correlation, distance, chiSquare } = _calculateMetrics(storedDescriptor, liveDescArray);
    
    console.log(`[OpenCV Face Auth] Student: ${studentId} | Confidence: ${compositeConfidence} (min ${MIN_COMPOSITE_CONFIDENCE}) | Corr: ${correlation.toFixed(3)} | Dist: ${distance.toFixed(3)} | Chi2: ${chiSquare.toFixed(2)}`);

    // Verified if composite confidence meets threshold AND minimum correlation floor is satisfied
    const matched = compositeConfidence >= MIN_COMPOSITE_CONFIDENCE && correlation >= STRICT_CORRELATION_FLOOR;

    if (matched) {
      const authenticationId = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 120000); // 2 minutes valid window

      await FaceVerificationEvent.create({
        studentId,
        result: 'SUCCESS',
        reasonCode: 'MATCH',
        authenticationId,
        expiresAt,
        confidenceScore: compositeConfidence,
      });

      profile.lastVerifiedAt = new Date();
      await profile.save();

      return {
        matched: true,
        authenticationId,
        expiresAt,
        confidence: compositeConfidence,
        message: 'Face verified successfully. Identity confirmed.',
      };
    } else {
      await FaceVerificationEvent.create({
        studentId,
        result: 'FAILED',
        reasonCode: 'NO_MATCH',
        confidenceScore: compositeConfidence,
      });

      return {
        matched: false,
        reason: 'NO_MATCH',
        confidence: compositeConfidence,
        message: 'Face mismatch: Biometric signature did not match registered profile. Please ensure good lighting and face alignment.',
      };
    }
  }

  async getProfile(studentId) {
    const profile = await FaceProfile.findOne({ studentId });
    return profile;
  }

  async deleteProfile(studentId) {
    const result = await FaceProfile.deleteOne({ studentId });
    await Student.findByIdAndUpdate(studentId, { faceRegistered: false });
    return result;
  }
}

module.exports = new FaceService();
