const db = require('../config/database');

const inventoryModel = {
  // Get all inventory items
  getAll: async (status = null, categoryId = null) => {
    let query = `
      SELECT i.*, c.category_name 
      FROM Inventory i
      LEFT JOIN Categories c ON i.category_id = c.category_id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ' AND i.status = ?';
      params.push(status);
    }

    if (categoryId) {
      query += ' AND i.category_id = ?';
      params.push(categoryId);
    }

    query += ' ORDER BY i.product_name';

    const [rows] = await db.query(query, params);
    return rows;
  },

  // Get single item by ID
  getById: async (inventoryId) => {
    const [rows] = await db.query(
      `SELECT i.*, c.category_name 
       FROM Inventory i
       LEFT JOIN Categories c ON i.category_id = c.category_id
       WHERE i.inventory_id = ?`,
      [inventoryId]
    );
    return rows[0];
  },

  // Get item by product code
  getByProductCode: async (productCode) => {
    const [rows] = await db.query(
      'SELECT * FROM Inventory WHERE product_code = ?',
      [productCode]
    );
    return rows[0];
  },

  // Add new product (calls stored procedure)
  addProduct: async (productData, adminId) => {
    const { productName, productCode, categoryId, description, unitPrice, quantity, reorderLevel, unitOfMeasure } = productData;
    
    const [rows] = await db.query(
      'CALL sp_AddProduct(?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [productName, productCode, categoryId, description, unitPrice, quantity, reorderLevel, unitOfMeasure, adminId]
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
    const { productName, categoryId, description, unitPrice, reorderLevel, unitOfMeasure } = productData;
    
    const [result] = await db.query(
      `UPDATE Inventory 
       SET product_name = ?, category_id = ?, description = ?, 
           unit_price = ?, reorder_level = ?, unit_of_measure = ?
       WHERE inventory_id = ?`,
      [productName, categoryId, description, unitPrice, reorderLevel, unitOfMeasure, inventoryId]
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
      `SELECT i.*, c.category_name 
       FROM Inventory i
       LEFT JOIN Categories c ON i.category_id = c.category_id
       WHERE i.quantity_in_stock <= i.reorder_level
       ORDER BY i.quantity_in_stock ASC`
    );
    return rows;
  }
};

module.exports = inventoryModel;