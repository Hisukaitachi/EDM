// backend/src/services/reportService.js
const reportModel = require('../models/reportModel');

const reportService = {
  // Staff Performance Report
  getStaffPerformanceReport: async (startDate, endDate) => {
    return await reportModel.getStaffPerformance(startDate, endDate);
  },

  // Low Stock Alert Report
  getLowStockReport: async () => {
    return await reportModel.getLowStockReport();
  },

  // Most Requested Items
  getMostRequestedItemsReport: async (startDate, endDate, limit = 10) => {
    return await reportModel.getMostRequestedItems(startDate, endDate, limit);
  },

  // Inventory Valuation by Product (now by Product Type)
  getInventoryValuationReport: async () => {
    return await reportModel.getInventoryValuation();
  },

  // Monthly Stock Movement
  getMonthlyStockMovementReport: async (year, month) => {
    const currentYear = year || new Date().getFullYear();
    const currentMonth = month || new Date().getMonth() + 1;
    
    return await reportModel.getMonthlyStockMovement(currentYear, currentMonth);
  },

  // Admin Performance (Request Approval Time)
  getRequestApprovalTimeReport: async (startDate, endDate) => {
    return await reportModel.getRequestApprovalTime(startDate, endDate);
  },

  // Inventory Turnover
  getInventoryTurnoverReport: async (startDate, endDate) => {
    return await reportModel.getInventoryTurnover(startDate, endDate);
  },

  // Daily Activity Summary
  getDailyActivityReport: async (date) => {
    const reportDate = date || new Date().toISOString().split('T')[0];
    return await reportModel.getDailyActivity(reportDate);
  },

  // Dashboard Analytics (for homepage)
  getDashboardAnalytics: async () => {
    return await reportModel.getDashboardAnalytics();
  }
};

module.exports = reportService;