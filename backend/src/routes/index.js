const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const inventoryRoutes = require('./inventoryRoutes');
const requestRoutes = require('./requestRoutes');
const userRoutes = require('./userRoutes');
const reportRoutes = require('./reportRoutes');

// Route prefixes
router.use('/auth', authRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/requests', requestRoutes);
router.use('/users', userRoutes);
router.use('/reports', reportRoutes);

module.exports = router;