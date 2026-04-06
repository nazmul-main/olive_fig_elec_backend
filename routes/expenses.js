const express = require('express');
const router = express.Router();
const { getExpenses, createExpense, updateExpense, deleteExpense } = require('../controllers/expenseController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');

router.get('/', protect, authorize('admin', 'manager'), getExpenses);
router.post('/', protect, authorize('admin', 'manager'), createExpense);
router.put('/:id', protect, authorize('admin', 'manager'), updateExpense);
router.delete('/:id', protect, authorize('admin'), deleteExpense);

module.exports = router;
