import api from './api';

export const notificationService = {
  // User In-App Inbox
  getNotifications: (params) => api.get('/notifications', { params }),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),

  // Admin Notification Center & Stats
  getStats: () => api.get('/notifications/stats'),

  // Notification Rules
  getRules: () => api.get('/notifications/rules'),
  updateRule: (id, data) => api.put(`/notifications/rules/${id}`, data),

  // Notification Templates & Preview
  getTemplates: () => api.get('/notifications/templates'),
  updateTemplate: (id, data) => api.put(`/notifications/templates/${id}`, data),
  previewTemplate: (data) => api.post('/notifications/templates/preview', data),

  // Parent Notification Contacts & Preferences
  getParentProfiles: (params) => api.get('/notifications/parents', { params }),
  updateParentProfile: (studentId, data) => api.put(`/notifications/parents/${studentId}`, data),

  // Department HOD Mapping
  getDepartmentHODs: () => api.get('/notifications/hods'),
  assignDepartmentHOD: (departmentId, data) => api.put(`/notifications/hods/${departmentId}`, data),

  // Audit Logs & Testing
  getNotificationJobs: (params) => api.get('/notifications/jobs', { params }),
  getNotificationJobDetail: (id) => api.get(`/notifications/jobs/${id}`),
  testNotification: (data) => api.post('/notifications/test', data),
};

export default notificationService;
