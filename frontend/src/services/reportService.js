import api from './api';

export const reportService = {
  generateReport: (sessionId) => api.post(`/reports/generate/${sessionId}`),
  getReports: (params) => api.get('/reports', { params }),
  getReport: (id) => api.get(`/reports/${id}`),
  downloadReport: (id) => api.get(`/reports/${id}/download`, { responseType: 'blob' }),
};

export default reportService;
