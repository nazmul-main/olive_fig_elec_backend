const express = require('express');
const router = express.Router();
const { createSale, getSales, getSale } = require('../controllers/saleController');
const { protect } = require('../middleware/auth');

router.post('/', protect, createSale);
router.get('/', protect, getSales);
router.get('/:id', protect, getSale);

module.exports = router;
