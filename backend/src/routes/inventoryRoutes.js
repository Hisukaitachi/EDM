const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const authenticateToken = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');

// All routes require authentication
router.use(authenticateToken);

// IMPORTANT: Specific routes MUST come BEFORE parameterized routes!
// Otherwise /:id will catch everything including '/alerts/low-stock'

// Get low stock alerts (Staff & Admin) - MOVED UP
router.get('/alerts/low-stock', inventoryController.getLowStock);

// Get all inventory (Staff & Admin)
router.get('/', inventoryController.getAll);

// Admin only routes
router.post('/', isAdmin, inventoryController.create);

// Get single item (Staff & Admin) - MOVED DOWN to avoid catching other routes
router.get('/:id', inventoryController.getById);

// More admin routes
router.put('/:id', isAdmin, inventoryController.update);
router.post('/:id/stock', isAdmin, inventoryController.updateStock);
router.delete('/:id', isAdmin, inventoryController.delete);

module.exports = router;