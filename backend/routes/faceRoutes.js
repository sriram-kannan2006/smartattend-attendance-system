const express = require('express');
const {
  registerFace,
  verifyFace,
  getFaceStatus,
  reregisterFace,
  revokeFace,
} = require('../controllers/faceController');
const { protect, authorize } = require('../middleware/auth');
const { faceLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.use(protect);

router.post('/register', authorize('STUDENT'), registerFace);
router.post('/verify', authorize('STUDENT'), faceLimiter, verifyFace);
router.get('/status', authorize('STUDENT', 'ADMIN'), getFaceStatus);
router.post('/reregister', authorize('STUDENT'), reregisterFace);
router.delete('/revoke/:studentId', authorize('ADMIN'), revokeFace);

module.exports = router;
