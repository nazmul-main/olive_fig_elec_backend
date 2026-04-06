const express = require('express');
const router = express.Router();
const { getSalesReport, getStockReport, getExpenseReport } = require('../controllers/reportController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');

router.get('/sales', protect, authorize('admin', 'manager'), getSalesReport);
router.get('/stock', protect, authorize('admin', 'manager'), getStockReport);
router.get('/expenses', protect, authorize('admin', 'manager'), getExpenseReport);

module.exports = router;
