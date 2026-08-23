import api from './api';

export const faceService = {
  registerFace: (descriptor) => api.post('/face/register', { descriptor }),
  verifyFace: (descriptor) => api.post('/face/verify', { descriptor }),
  getFaceStatus: () => api.get('/face/status'),
  reregisterFace: (descriptor) => api.post('/face/reregister', { descriptor }),
  revokeFace: (studentId) => api.delete(`/face/revoke/${studentId}`),
};

export default faceService;
