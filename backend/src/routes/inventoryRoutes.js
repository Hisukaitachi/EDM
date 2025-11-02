const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const authenticateToken = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');

// All routes require authentication
router.use(authenticateToken);

// Get all inventory (Staff & Admin)
router.get('/', inventoryController.getAll);

// Get single item (Staff & Admin)
router.get('/:id', inventoryController.getById);

// Get low stock alerts (Staff & Admin)
router.get('/alerts/low-stock', inventoryController.getLowStock);

// Admin only routes
router.post('/', isAdmin, inventoryController.create);
router.put('/:id', isAdmin, inventoryController.update);
router.post('/:id/stock', isAdmin, inventoryController.updateStock);
router.delete('/:id', isAdmin, inventoryController.delete);

module.exports = router;