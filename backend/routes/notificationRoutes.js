const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getNotificationStats,
  getNotificationRules,
  updateNotificationRule,
  getTemplates,
  updateTemplate,
  previewTemplate,
  getParentNotificationProfiles,
  updateParentNotificationProfile,
  getDepartmentHODs,
  assignDepartmentHOD,
  testNotification,
  getNotificationJobs,
  getNotificationJobDetail,
} = require('../controllers/notificationController');

const router = express.Router();
router.use(protect);

// 1. User In-App Inbox endpoints (All authenticated users)
router.get('/', getNotifications);
router.put('/read-all', markAllAsRead);
router.put('/:id/read', markAsRead);

// 2. Admin Notification Center & Statistics
router.get('/stats', authorize('ADMIN'), getNotificationStats);

// 3. Notification Rules
router.get('/rules', authorize('ADMIN'), getNotificationRules);
router.put('/rules/:id', authorize('ADMIN'), updateNotificationRule);

// 4. Notification Templates & Preview
router.get('/templates', authorize('ADMIN'), getTemplates);
router.put('/templates/:id', authorize('ADMIN'), updateTemplate);
router.post('/templates/preview', authorize('ADMIN'), previewTemplate);

// 5. Parent Notification Contacts & Preferences Management
router.get('/parents', authorize('ADMIN'), getParentNotificationProfiles);
router.put('/parents/:studentId', authorize('ADMIN'), updateParentNotificationProfile);

// 6. Department HOD Mapping Management
router.get('/hods', authorize('ADMIN'), getDepartmentHODs);
router.put('/hods/:departmentId', authorize('ADMIN'), assignDepartmentHOD);

// 7. Testing & Audit Log Endpoints
router.post('/test', authorize('ADMIN'), testNotification);
router.get('/jobs', authorize('ADMIN'), getNotificationJobs);
router.get('/jobs/:id', authorize('ADMIN'), getNotificationJobDetail);

module.exports = router;
