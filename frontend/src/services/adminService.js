import api from './api';

export const adminService = {
  getDepartments: (params) => api.get('/admin/departments', { params }),
  createDepartment: (data) => api.post('/admin/departments', data),
  updateDepartment: (id, data) => api.put(`/admin/departments/${id}`, data),
  deleteDepartment: (id) => api.delete(`/admin/departments/${id}`),

  getClasses: (params) => api.get('/admin/classes', { params }),
  createClass: (data) => api.post('/admin/classes', data),
  updateClass: (id, data) => api.put(`/admin/classes/${id}`, data),
  deleteClass: (id) => api.delete(`/admin/classes/${id}`),

  getSubjects: (params) => api.get('/admin/subjects', { params }),
  createSubject: (data) => api.post('/admin/subjects', data),
  updateSubject: (id, data) => api.put(`/admin/subjects/${id}`, data),
  deleteSubject: (id) => api.delete(`/admin/subjects/${id}`),

  getTimetable: (params) => api.get('/admin/timetable', { params }),
  getTimetableByClass: (classId) => api.get(`/admin/timetable/class/${classId}`),
  createTimetableEntry: (data) => api.post('/admin/timetable', data),
  updateTimetableEntry: (id, data) => api.put(`/admin/timetable/${id}`, data),
  deleteTimetableEntry: (id) => api.delete(`/admin/timetable/${id}`),

  getAcademicYears: () => api.get('/admin/academic-years'),
  createAcademicYear: (data) => api.post('/admin/academic-years', data),
  setCurrentAcademicYear: (id) => api.put(`/admin/academic-years/${id}/current`),

  getHostels: (params) => api.get('/admin/hostels', { params }),
  createHostel: (data) => api.post('/admin/hostels', data),
  updateHostel: (id, data) => api.put(`/admin/hostels/${id}`, data),

  getAllStudents: (params) => api.get('/admin/students', { params }),
  getStudent: (id) => api.get(`/admin/students/${id}`),
  updateStudent: (id, data) => api.put(`/admin/students/${id}`, data),
  deleteStudent: (id) => api.delete(`/admin/students/${id}`),

  getAllTeachers: (params) => api.get('/admin/teachers', { params }),
  getTeacher: (id) => api.get(`/admin/teachers/${id}`),
  updateTeacher: (id, data) => api.put(`/admin/teachers/${id}`, data),
  deleteTeacher: (id) => api.delete(`/admin/teachers/${id}`),
};

export default adminService;
