const reportService = require('../services/reportService');

const reportController = {
  // GET /api/reports/staff-performance
  getStaffPerformance: async (req, res, next) => {
    try {
      const { startDate, endDate } = req.query;
      const report = await reportService.getStaffPerformanceReport(startDate, endDate);

      res.json({
        success: true,
        data: report
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/reports/low-stock
  getLowStock: async (req, res, next) => {
    try {
      const report = await reportService.getLowStockReport();

      res.json({
        success: true,
        count: report.length,
        data: report
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/reports/most-requested
  getMostRequested: async (req, res, next) => {
    try {
      const { startDate, endDate, limit } = req.query;
      const report = await reportService.getMostRequestedItemsReport(
        startDate, 
        endDate, 
        limit ? parseInt(limit) : 10
      );

      res.json({
        success: true,
        data: report
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/reports/inventory-valuation
  getInventoryValuation: async (req, res, next) => {
    try {
      const report = await reportService.getInventoryValuationReport();

      res.json({
        success: true,
        data: report
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/reports/monthly-movement
  getMonthlyMovement: async (req, res, next) => {
    try {
      const { year, month } = req.query;
      const report = await reportService.getMonthlyStockMovementReport(
        year ? parseInt(year) : null,
        month ? parseInt(month) : null
      );

      res.json({
        success: true,
        data: report
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/reports/approval-time
  getApprovalTime: async (req, res, next) => {
    try {
      const { startDate, endDate } = req.query;
      const report = await reportService.getRequestApprovalTimeReport(startDate, endDate);

      res.json({
        success: true,
        data: report
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/reports/inventory-turnover
  getInventoryTurnover: async (req, res, next) => {
    try {
      const { startDate, endDate } = req.query;
      const report = await reportService.getInventoryTurnoverReport(startDate, endDate);

      res.json({
        success: true,
        data: report
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/reports/daily-activity
  getDailyActivity: async (req, res, next) => {
    try {
      const { date } = req.query;
      const report = await reportService.getDailyActivityReport(date);

      res.json({
        success: true,
        data: report
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/reports/dashboard
  getDashboard: async (req, res, next) => {
    try {
      const analytics = await reportService.getDashboardAnalytics();

      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = reportController;