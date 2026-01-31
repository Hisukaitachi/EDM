// backend/src/models/reportModel.js
const db = require('../config/database');

const reportModel = {
  // Staff Performance Report
  getStaffPerformance: async (startDate = null, endDate = null) => {
    const [rows] = await db.query(
      'CALL sp_GetStaffPerformanceReport(?, ?)',
      [startDate, endDate]
    );
    return rows[0] || [];
  },

  // Low Stock Report
  getLowStockReport: async () => {
    const [rows] = await db.query('CALL sp_GetLowStockReport()');
    return rows[0] || [];
  },

  // Most Requested Items Report
  getMostRequestedItems: async (startDate = null, endDate = null, limit = 10) => {
    const [rows] = await db.query(
      'CALL sp_GetMostRequestedItemsReport(?, ?, ?)',
      [startDate, endDate, limit]
    );
    return rows[0] || [];
  },

  // Inventory Valuation Report
  getInventoryValuation: async () => {
    const [rows] = await db.query('CALL sp_GetInventoryValuationReport()');
    return rows[0] || [];
  },

  // Monthly Stock Movement Report
  getMonthlyStockMovement: async (year, month) => {
    const [rows] = await db.query(
      'CALL sp_GetMonthlyStockMovementReport(?, ?)',
      [year, month]
    );
    return rows[0] || [];
  },

  // Request Approval Time Report
  getRequestApprovalTime: async (startDate = null, endDate = null) => {
    const [rows] = await db.query(
      'CALL sp_GetRequestApprovalTimeReport(?, ?)',
      [startDate, endDate]
    );
    return rows[0] || [];
  },

  // Inventory Turnover Report
  getInventoryTurnover: async (startDate = null, endDate = null) => {
    const [rows] = await db.query(
      'CALL sp_GetInventoryTurnoverReport(?, ?)',
      [startDate, endDate]
    );
    return rows[0] || [];
  },

  // Daily Activity Report
  getDailyActivity: async (date) => {
    const [rows] = await db.query(
      'CALL sp_GetDailyActivityReport(?)',
      [date]
    );
    return rows[0] || [];
  },

  // Dashboard Analytics
  getDashboardAnalytics: async () => {
    const [rows] = await db.query('CALL sp_GetDashboardAnalytics()');
    // This procedure returns multiple result sets
    // Return all of them as an object
    return {
      totalProducts: rows[0]?.[0]?.total_products || 0,
      lowStockItems: rows[1]?.[0]?.low_stock_items || 0,
      pendingRequests: rows[2]?.[0]?.pending_requests || 0,
      totalInventoryValue: rows[3]?.[0]?.total_inventory_value || 0,
      recentTransactions: rows[4]?.[0]?.recent_transactions || 0
    };
  }
};

module.exports = reportModel;
