// front/src/services/inventoryService.js
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

  // Add new product (Admin only)
  create: async (productData) => {
    // Map frontend field names to backend field names
    const backendData = {
      productName: productData.name,
      productCode: productData.code,
      categoryId: productData.categoryId || productData.category,
      description: productData.description,
      unitPrice: parseFloat(productData.price),
      quantity: parseInt(productData.stock),
      reorderLevel: parseInt(productData.threshold),
      unitOfMeasure: productData.unit || 'pcs'
    };
    
    const response = await api.post('/inventory', backendData);
    return response.data;
  },

  // Update product (Admin only)
  update: async (id, productData) => {
    // Map frontend field names to backend field names
    const backendData = {
      productName: productData.name,
      categoryId: productData.categoryId || productData.category,
      description: productData.description,
      unitPrice: parseFloat(productData.price),
      reorderLevel: parseInt(productData.threshold),
      unitOfMeasure: productData.unit || 'pcs'
    };
    
    const response = await api.put(`/inventory/${id}`, backendData);
    return response.data;
  },

  // Update stock quantity (Admin only)
  updateStock: async (id, stockData) => {
    // Backend expects: { quantityChange, transactionType, notes }
    const backendData = {
      quantityChange: stockData.type === 'set' 
        ? stockData.quantity // If setting directly, we'll need to calculate the change
        : parseInt(stockData.quantity),
      transactionType: stockData.type === 'set' ? 'adjust' : stockData.type,
      notes: stockData.notes || 'Stock updated from frontend'
    };
    
    const response = await api.post(`/inventory/${id}/stock`, backendData);
    return response.data;
  },

  // Delete product (Admin only)
  delete: async (id) => {
    const response = await api.delete(`/inventory/${id}`);
    return response.data;
  },

  // Get low stock items
  getLowStock: async () => {
    const response = await api.get('/inventory/alerts/low-stock');
    return response.data;
  },

  // Get all categories
  getCategories: async () => {
    const response = await api.get('/categories');
    return response.data;
  },

  // Create category (Admin only)
  createCategory: async (categoryData) => {
    const backendData = {
      categoryName: categoryData.name || categoryData.categoryName,
      description: categoryData.description
    };
    const response = await api.post('/categories', backendData);
    return response.data;
  },

  // Update category (Admin only)
  updateCategory: async (id, categoryData) => {
    const backendData = {
      categoryName: categoryData.name || categoryData.categoryName,
      description: categoryData.description
    };
    const response = await api.put(`/categories/${id}`, backendData);
    return response.data;
  },

  // Delete category (Admin only)
  deleteCategory: async (id) => {
    const response = await api.delete(`/categories/${id}`);
    return response.data;
  }
};

export default inventoryService;