const express = require('express');
const router = express.Router();
const { createSale, getSales, getSale, deleteSale } = require('../controllers/saleController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');

router.post('/', protect, createSale);
router.get('/', protect, getSales);
router.get('/:id', protect, getSale);
router.delete('/:id', protect, authorize('admin'), deleteSale);

module.exports = router;
