const express = require('express');
const router = express.Router();
const requestController = require('../controllers/requestController');
const authenticateToken = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');

// All routes require authentication
router.use(authenticateToken);

// Staff & Admin routes
router.get('/', requestController.getAll);
router.get('/my-requests', requestController.getMyRequests);
router.get('/stats/pending', requestController.getPendingCount);
router.get('/:id', requestController.getById);
router.post('/', requestController.create);

// Admin only routes
router.put('/:id/process', isAdmin, requestController.process);

module.exports = router;