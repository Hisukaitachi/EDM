const inventoryModel = require('../models/inventoryModel');

const inventoryService = {
  // Get all inventory
  getAllInventory: async (filters = {}) => {
    return await inventoryModel.getAll(filters.status, filters.categoryId);
  },

  // Get single item
  getInventoryById: async (inventoryId) => {
    const item = await inventoryModel.getById(inventoryId);
    if (!item) {
      throw new Error('Inventory item not found');
    }
    return item;
  },

  // Add new product
  addProduct: async (productData, adminId) => {
    // Check if product code already exists
    const existing = await inventoryModel.getByProductCode(productData.productCode);
    if (existing) {
      throw new Error('Product code already exists');
    }

    // Validate required fields
    if (!productData.productName || !productData.productCode || !productData.unitPrice) {
      throw new Error('Product name, code, and price are required');
    }

    return await inventoryModel.addProduct(productData, adminId);
  },

  // Update stock quantity
  updateStock: async (inventoryId, quantityChange, transactionType, adminId, notes = '') => {
    // Verify item exists
    await inventoryService.getInventoryById(inventoryId);

    return await inventoryModel.updateStock(inventoryId, quantityChange, transactionType, adminId, notes);
  },

  // Update product details
  updateProduct: async (inventoryId, productData) => {
    // Verify item exists
    await inventoryService.getInventoryById(inventoryId);

    const result = await inventoryModel.updateProduct(inventoryId, productData);
    if (result === 0) {
      throw new Error('Failed to update product');
    }
    return { message: 'Product updated successfully' };
  },

  // Delete product
  deleteProduct: async (inventoryId) => {
    // Verify item exists
    await inventoryService.getInventoryById(inventoryId);

    const result = await inventoryModel.delete(inventoryId);
    if (result === 0) {
      throw new Error('Failed to delete product');
    }
    return { message: 'Product deleted successfully' };
  },

  // Get low stock items
  getLowStockItems: async () => {
    return await inventoryModel.getLowStock();
  }
};

module.exports = inventoryService;