// backend/src/routes/categoryRoutes.js
const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const authenticateToken = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');

// All routes require authentication
router.use(authenticateToken);

// Get all categories (Staff & Admin can view)
router.get('/', categoryController.getAll);

// Get single category (Staff & Admin can view)
router.get('/:id', categoryController.getById);

// Admin only routes
router.post('/', isAdmin, categoryController.create);
router.put('/:id', isAdmin, categoryController.update);
router.delete('/:id', isAdmin, categoryController.delete);

module.exports = router;