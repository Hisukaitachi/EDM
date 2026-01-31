// front/src/services/inventoryService.js
import api from '../api/api';

const inventoryService = {
  // Get all inventory
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.productTypeId) params.append('productTypeId', filters.productTypeId); // CHANGED from categoryId
    
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
      // productCode: productData.code, // REMOVED - field no longer exists
      productTypeId: productData.productTypeId || productData.category, // CHANGED from categoryId
      description: productData.description,
      unitPrice: parseFloat(productData.price),
      quantity: parseInt(productData.stock),
      size: productData.size, // CHANGED - now kept as string instead of parseInt
      unitOfMeasure: productData.unit || 'pcs'
    };
    
    console.log('Sending to backend:', backendData);
    const response = await api.post('/inventory', backendData);
    return response.data;
  },

  // Update product (Admin only)
  update: async (id, productData) => {
    // Map frontend field names to backend field names
    const backendData = {
      productName: productData.name,
      productTypeId: productData.productTypeId || productData.category, // CHANGED from categoryId
      description: productData.description,
      unitPrice: parseFloat(productData.price),
      size: productData.size, // CHANGED - now kept as string instead of parseInt
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

  // Get all product types (renamed from getCategories)
  getProductTypes: async () => {
    const response = await api.get('/product'); // Endpoint stays same
    return response.data;
  },

  // Keep old method name for backward compatibility (optional - can be removed)
  getCategories: async () => {
    return inventoryService.getProductTypes();
  },

  // Create product type (Admin only) - renamed from createCategory
  createProductType: async (productTypeData) => {
    const backendData = {
      productTypeName: productTypeData.name || productTypeData.productTypeName, // CHANGED from categoryName
      description: productTypeData.description
    };
    const response = await api.post('/product', backendData); // Endpoint stays same
    return response.data;
  },

  // Keep old method name for backward compatibility (optional - can be removed)
  createCategory: async (categoryData) => {
    return inventoryService.createProductType(categoryData);
  },

  // Update product type (Admin only) - renamed from updateCategory
  updateProductType: async (id, productTypeData) => {
    const backendData = {
      productTypeName: productTypeData.name || productTypeData.productTypeName, // CHANGED from categoryName
      description: productTypeData.description
    };
    const response = await api.put(`/product/${id}`, backendData); // Endpoint stays same
    return response.data;
  },

  // Keep old method name for backward compatibility (optional - can be removed)
  updateCategory: async (id, categoryData) => {
    return inventoryService.updateProductType(id, categoryData);
  },

  // Delete product type (Admin only) - renamed from deleteCategory
  deleteProductType: async (id) => {
    const response = await api.delete(`/product/${id}`); // Endpoint stays same
    return response.data;
  },

  // Keep old method name for backward compatibility (optional - can be removed)
  deleteCategory: async (id) => {
    return inventoryService.deleteProductType(id);
  }
};

export default inventoryService;