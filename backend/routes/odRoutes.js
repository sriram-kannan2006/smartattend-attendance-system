const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect, authorize } = require('../middleware/auth');
const { createODRequest, getODRequests, updateODRequest } = require('../controllers/odController');

const router = express.Router();
router.use(protect);

router.post(
  '/',
  authorize('STUDENT'),
  [
    body('date').notEmpty().withMessage('Date is required'),
    body('startHour').isInt({ min: 1, max: 8 }).withMessage('Start hour must be 1-8'),
    body('endHour').isInt({ min: 1, max: 8 }).withMessage('End hour must be 1-8'),
    body('reason').trim().notEmpty().withMessage('Reason is required'),
  ],
  validate,
  createODRequest
);

router.get('/', authorize('STUDENT', 'TEACHER', 'ADMIN'), getODRequests);

router.put(
  '/:id',
  authorize('TEACHER', 'ADMIN'),
  [
    body('status').isIn(['APPROVED', 'REJECTED']).withMessage('Status must be APPROVED or REJECTED'),
  ],
  validate,
  updateODRequest
);

module.exports = router;
