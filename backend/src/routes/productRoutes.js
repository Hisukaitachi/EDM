// backend/src/routes/productRoutes.js
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const authenticateToken = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');

// All routes require authentication
router.use(authenticateToken);

// Get all categories (Staff & Admin can view)
router.get('/', productController.getAll);

// Get single product (Staff & Admin can view)
router.get('/:id', productController.getById);

// Admin only routes
router.post('/', isAdmin, productController.create);
router.put('/:id', isAdmin, productController.update);
router.delete('/:id', isAdmin, productController.delete);

module.exports = router;