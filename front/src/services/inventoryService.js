import api from '../api/api';

const inventoryService = {
  // Get all inventory
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.categoryId) params.append('categoryId', filters.categoryId);
    
    const response = await api.get(`/inventory?${params}`);
    return response.data;
  },

  // Get single item
  getById: async (id) => {
    const response = await api.get(`/inventory/${id}`);
    return response.data;
  },

  // Add new product
  create: async (productData) => {
    const response = await api.post('/inventory', productData);
    return response.data;
  },

  // Update product
  update: async (id, productData) => {
    const response = await api.put(`/inventory/${id}`, productData);
    return response.data;
  },

  // Update stock quantity
  updateStock: async (id, stockData) => {
    const response = await api.post(`/inventory/${id}/stock`, stockData);
    return response.data;
  },

  // Delete product
  delete: async (id) => {
    const response = await api.delete(`/inventory/${id}`);
    return response.data;
  },

  // Get low stock items
  getLowStock: async () => {
    const response = await api.get('/inventory/alerts/low-stock');
    return response.data;
  },

  // Categories
  getCategories: async () => {
    const response = await api.get('/inventory/categories');
    return response.data;
  },

  createCategory: async (categoryData) => {
    const response = await api.post('/inventory/categories', categoryData);
    return response.data;
  }
};

export default inventoryService;