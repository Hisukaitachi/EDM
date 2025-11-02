const db = require('../config/database');

const requestModel = {
  // Get all requests with filters
  getAll: async (status = null, userId = null) => {
    let query = `
      SELECT 
        sr.*,
        i.product_name,
        i.product_code,
        u_req.full_name AS requested_by_name,
        u_app.full_name AS approved_by_name
      FROM StockRequests sr
      INNER JOIN Inventory i ON sr.inventory_id = i.inventory_id
      INNER JOIN Users u_req ON sr.requested_by = u_req.user_id
      LEFT JOIN Users u_app ON sr.approved_by = u_app.user_id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ' AND sr.request_status = ?';
      params.push(status);
    }

    if (userId) {
      query += ' AND sr.requested_by = ?';
      params.push(userId);
    }

    query += ' ORDER BY sr.created_at DESC';

    const [rows] = await db.query(query, params);
    return rows;
  },

  // Get single request by ID
  getById: async (requestId) => {
    const [rows] = await db.query(
      `SELECT 
        sr.*,
        i.product_name,
        i.product_code,
        i.unit_price,
        u_req.full_name AS requested_by_name,
        u_app.full_name AS approved_by_name
      FROM StockRequests sr
      INNER JOIN Inventory i ON sr.inventory_id = i.inventory_id
      INNER JOIN Users u_req ON sr.requested_by = u_req.user_id
      LEFT JOIN Users u_app ON sr.approved_by = u_app.user_id
      WHERE sr.request_id = ?`,
      [requestId]
    );
    return rows[0];
  },

  // Create new request (calls stored procedure)
  create: async (inventoryId, staffId, quantity, reason) => {
    const [rows] = await db.query(
      'CALL sp_CreateStockRequest(?, ?, ?, ?)',
      [inventoryId, staffId, quantity, reason]
    );
    return rows[0][0];
  },

  // Process request - approve/reject (calls stored procedure)
  process: async (requestId, adminId, status, notes) => {
    const [rows] = await db.query(
      'CALL sp_ProcessStockRequest(?, ?, ?, ?)',
      [requestId, adminId, status, notes]
    );
    return rows[0][0];
  },

  // Get pending requests count
  getPendingCount: async () => {
    const [rows] = await db.query(
      'SELECT COUNT(*) AS count FROM StockRequests WHERE request_status = ?',
      ['pending']
    );
    return rows[0].count;
  },

  // Get user's request history
  getUserRequests: async (userId) => {
    const [rows] = await db.query(
      `SELECT 
        sr.*,
        i.product_name,
        i.product_code
      FROM StockRequests sr
      INNER JOIN Inventory i ON sr.inventory_id = i.inventory_id
      WHERE sr.requested_by = ?
      ORDER BY sr.created_at DESC`,
      [userId]
    );
    return rows;
  }
};

module.exports = requestModel;