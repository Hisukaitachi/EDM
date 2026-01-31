// backend/src/models/inventoryModel.js
const db = require('../config/database');

const inventoryModel = {
  // Get all inventory items
  getAll: async (status = null, productTypeId = null) => { // Changed from categoryId
    let query = `
      SELECT i.*, pt.product_type_name 
      FROM Inventory i
      LEFT JOIN ProductTypes pt ON i.product_type_id = pt.product_type_id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ' AND i.status = ?';
      params.push(status);
    }

    if (productTypeId) { // Changed from categoryId
      query += ' AND i.product_type_id = ?';
      params.push(productTypeId);
    }

    query += ' ORDER BY i.product_name';

    const [rows] = await db.query(query, params);
    return rows;
  },

  // Get single item by ID
  getById: async (inventoryId) => {
    const [rows] = await db.query(
      `SELECT i.*, pt.product_type_name 
       FROM Inventory i
       LEFT JOIN ProductTypes pt ON i.product_type_id = pt.product_type_id
       WHERE i.inventory_id = ?`,
      [inventoryId]
    );
    return rows[0];
  },

  // REMOVED: getByProductCode method (product_code no longer exists)

  // Add new product (calls stored procedure)
  addProduct: async (productData, adminId) => {
    const { productName, productTypeId, description, unitPrice, quantity, size, unitOfMeasure } = productData;
    // Removed: productCode
    // Changed: categoryId → productTypeId, reorderLevel → size
    
    const [rows] = await db.query(
      'CALL sp_AddProduct(?, ?, ?, ?, ?, ?, ?, ?)',
      [productName, productTypeId, description, unitPrice, quantity, size, unitOfMeasure, adminId]
    );
    return rows[0][0]; // Returns result from stored procedure
  },

  // Update stock (calls stored procedure)
  updateStock: async (inventoryId, quantityChange, transactionType, adminId, notes) => {
    const [rows] = await db.query(
      'CALL sp_UpdateStock(?, ?, ?, ?, ?)',
      [inventoryId, quantityChange, transactionType, adminId, notes]
    );
    return rows[0][0];
  },

  // Update product details
  updateProduct: async (inventoryId, productData) => {
    const { productName, productTypeId, description, unitPrice, size, unitOfMeasure } = productData;
    // Changed: categoryId → productTypeId, reorderLevel → size
    
    const [result] = await db.query(
      `UPDATE Inventory 
       SET product_name = ?, product_type_id = ?, description = ?, 
           unit_price = ?, size = ?, unit_of_measure = ?
       WHERE inventory_id = ?`,
      [productName, productTypeId, description, unitPrice, size, unitOfMeasure, inventoryId]
    );
    return result.affectedRows;
  },

  // Delete product
  delete: async (inventoryId) => {
    const [result] = await db.query(
      'DELETE FROM Inventory WHERE inventory_id = ?',
      [inventoryId]
    );
    return result.affectedRows;
  },

  // Get low stock items
  getLowStock: async () => {
    const [rows] = await db.query(
      `SELECT i.*, pt.product_type_name 
       FROM Inventory i
       LEFT JOIN ProductTypes pt ON i.product_type_id = pt.product_type_id
       WHERE i.quantity_in_stock <= i.size
       ORDER BY i.quantity_in_stock ASC`
      // Changed: reorder_level → size
    );
    return rows;
  }
};

module.exports = inventoryModel;