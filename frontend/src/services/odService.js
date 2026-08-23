import api from './api';

export const odService = {
  createODRequest: (data) => api.post('/od', data),
  getODRequests: (params) => api.get('/od', { params }),
  updateODRequest: (id, data) => api.put(`/od/${id}`, data),
};

export default odService;
