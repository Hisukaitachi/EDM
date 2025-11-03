// front/src/services/requestService.js
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

  // Create new request (Staff)
  create: async (requestData) => {
    // Backend expects: { inventoryId, quantity, reason }
    const backendData = {
      inventoryId: parseInt(requestData.inventoryId),
      quantity: parseInt(requestData.quantity),
      reason: requestData.reason || ''
    };
    
    const response = await api.post('/requests', backendData);
    return response.data;
  },

  // Process request (Admin approve/reject)
  process: async (id, processData) => {
    // Backend expects: { status: 'approved' | 'rejected', notes: string }
    const backendData = {
      status: processData.status.toLowerCase(), // Backend uses lowercase
      notes: processData.notes || ''
    };
    
    const response = await api.put(`/requests/${id}/process`, backendData);
    return response.data;
  },

  // Get my requests (Staff)
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