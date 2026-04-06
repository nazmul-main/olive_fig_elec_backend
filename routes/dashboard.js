const express = require('express');
const router = express.Router();
const { getDashboardStats, getInventoryStats, adjustStock } = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');

router.get('/', protect, getDashboardStats);
router.get('/inventory', protect, getInventoryStats);
router.post('/stock-adjustment', protect, authorize('admin', 'manager'), adjustStock);

module.exports = router;
