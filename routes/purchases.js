const express = require('express');
const router = express.Router();
const { getPurchases, createPurchase, getPurchasesBySupplier } = require('../controllers/purchaseController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');

router.get('/', protect, getPurchases);
router.post('/', protect, authorize('admin', 'manager'), createPurchase);
router.get('/by-supplier/:supplierId', protect, getPurchasesBySupplier);

module.exports = router;
