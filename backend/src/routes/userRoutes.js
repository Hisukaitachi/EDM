const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authenticateToken = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');

// All routes require authentication
router.use(authenticateToken);

// Admin only routes
router.get('/', isAdmin, userController.getAll);
router.get('/staff/list', isAdmin, userController.getStaffList);
router.get('/:id', isAdmin, userController.getById);
router.post('/', isAdmin, userController.create);
router.put('/:id/status', isAdmin, userController.updateStatus);

module.exports = router;