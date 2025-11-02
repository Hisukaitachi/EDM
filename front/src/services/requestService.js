import api from '../api/api';

const requestService = {
  // Get all requests
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.userId) params.append('userId', filters.userId);
    
    const response = await api.get(`/requests?${params}`);
    return response.data;
  },

  // Get single request
  getById: async (id) => {
    const response = await api.get(`/requests/${id}`);
    return response.data;
  },

  // Create new request
  create: async (requestData) => {
    const response = await api.post('/requests', requestData);
    return response.data;
  },

  // Process request (approve/reject)
  process: async (id, processData) => {
    const response = await api.put(`/requests/${id}/process`, processData);
    return response.data;
  },

  // Get my requests
  getMyRequests: async () => {
    const response = await api.get('/requests/my-requests');
    return response.data;
  },

  // Get pending count
  getPendingCount: async () => {
    const response = await api.get('/requests/stats/pending');
    return response.data;
  }
};

export default requestService;