import api from './api';

export const attendanceService = {
  createSession: (data) => api.post('/attendance/session', data),
  getSession: (id) => api.get(`/attendance/session/${id}`),
  getSessionQR: (id) => api.get(`/attendance/session/${id}/qr`),
  rotateQR: (id) => api.post(`/attendance/session/${id}/rotate-qr`),
  closeSession: (id) => api.post(`/attendance/session/${id}/close`),
  scanAttendance: (data) => api.post('/attendance/scan', data),
  getStudentAttendance: (studentId = 'me', params) => {
    if (typeof studentId === 'object') {
      params = studentId;
      studentId = 'me';
    }
    return api.get(`/attendance/student/${studentId}`, { params });
  },
  getTeacherSessions: (params) => api.get('/attendance/teacher/sessions', { params }),
  correctAttendance: (id, data) => api.put(`/attendance/${id}/correct`, data),
  manualMark: (sessionId, data) => api.post(`/attendance/session/${sessionId}/manual-mark`, data),
  getAllSessions: (params) => api.get('/attendance', { params }),
};

export default attendanceService;
