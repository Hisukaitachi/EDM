// backend/src/services/inventoryService.js
const inventoryModel = require('../models/inventoryModel');

const inventoryService = {
  // Get all inventory
  getAllInventory: async (filters = {}) => {
    return await inventoryModel.getAll(filters.status, filters.productTypeId); // Changed from categoryId
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
    // REMOVED: Check for product code (field no longer exists)
    // REMOVED: const existing = await inventoryModel.getByProductCode(productData.productCode);

    // Validate required fields (removed productCode from validation)
    if (!productData.productName || !productData.unitPrice) {
      throw new Error('Product name and price are required');
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