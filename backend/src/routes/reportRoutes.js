const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const authenticateToken = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');

// All routes require authentication
router.use(authenticateToken);

// Dashboard analytics (both staff & admin)
router.get('/dashboard', reportController.getDashboard);

// Admin only reports
router.get('/staff-performance', isAdmin, reportController.getStaffPerformance);
router.get('/low-stock', isAdmin, reportController.getLowStock);
router.get('/most-requested', isAdmin, reportController.getMostRequested);
router.get('/inventory-valuation', isAdmin, reportController.getInventoryValuation);
router.get('/monthly-movement', isAdmin, reportController.getMonthlyMovement);
router.get('/approval-time', isAdmin, reportController.getApprovalTime);
router.get('/inventory-turnover', isAdmin, reportController.getInventoryTurnover);
router.get('/daily-activity', isAdmin, reportController.getDailyActivity);

module.exports = router;