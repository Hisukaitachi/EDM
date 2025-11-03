// backend/src/routes/index.js
const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const inventoryRoutes = require('./inventoryRoutes');
const requestRoutes = require('./requestRoutes');
const userRoutes = require('./userRoutes');
const reportRoutes = require('./reportRoutes');
const categoryRoutes = require('./categoryRoutes'); // NEW

// Route prefixes
router.use('/auth', authRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/requests', requestRoutes);
router.use('/users', userRoutes);
router.use('/reports', reportRoutes);
router.use('/categories', categoryRoutes); // NEW

module.exports = router;