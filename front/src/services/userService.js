// front/src/services/userService.js
import api from '../api/api';

const userService = {
  // Get all users (Admin only)
  getAll: async () => {
    const response = await api.get('/users');
    return response.data;
  },

  // Get user by ID (Admin only)
  getById: async (id) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  // Create new user (Admin only)
  create: async (userData) => {
    // Backend expects: { username, password, fullName, role }
    const backendData = {
      username: userData.username,
      password: userData.password,
      fullName: userData.fullName || userData.full_name || `${userData.username} User`,
      role: userData.role || 'staff'
    };
    
    const response = await api.post('/users', backendData);
    return response.data;
  },

  // Update user (Admin only) - Backend doesn't have this endpoint
  // We'll use updateStatus instead
  update: async (id, userData) => {
    // This endpoint doesn't exist in backend
    // You'd need to add it or use individual update endpoints
    throw new Error('User update endpoint not implemented in backend');
  },

  // Update user status (Admin only)
  updateStatus: async (id, status) => {
    // Backend expects: { status: 'active' | 'inactive' }
    const backendData = {
      status: status
    };
    
    const response = await api.put(`/users/${id}/status`, backendData);
    return response.data;
  },

  // Get staff list only (Admin only)
  getStaffList: async () => {
    const response = await api.get('/users/staff/list');
    return response.data;
  }
};

export default userService;