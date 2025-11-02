import api from '../api/api';

const userService = {
  // Get all users
  getAll: async () => {
    const response = await api.get('/users');
    return response.data;
  },

  // Get user by ID
  getById: async (id) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  // Create new user
  create: async (userData) => {
    const response = await api.post('/users', userData);
    return response.data;
  },

  // Update user status
  updateStatus: async (id, status) => {
    const response = await api.put(`/users/${id}/status`, { status });
    return response.data;
  },

  // Get staff list
  getStaffList: async () => {
    const response = await api.get('/users/staff/list');
    return response.data;
  }
};

export default userService;