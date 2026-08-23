const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { 
  generateReport, 
  streamSessionReport, 
  getReports, 
  getReport, 
  downloadReport 
} = require('../controllers/reportController');

const router = express.Router();

router.use(protect);

// Generate report metadata (POST)
router.post('/generate/:sessionId', authorize('TEACHER', 'ADMIN'), generateReport);

// Stream and download report by Session ID directly (GET)
router.get('/generate/:sessionId', authorize('TEACHER', 'ADMIN'), streamSessionReport);
router.get('/session/:sessionId/download', authorize('TEACHER', 'ADMIN'), streamSessionReport);

// Reports management
router.get('/', authorize('TEACHER', 'ADMIN'), getReports);
router.get('/:id', authorize('TEACHER', 'ADMIN'), getReport);
router.get('/:id/download', authorize('TEACHER', 'ADMIN'), downloadReport);

module.exports = router;
