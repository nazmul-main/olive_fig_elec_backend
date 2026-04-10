const express = require('express');
const router = express.Router();
const {
    getSuppliers, getSupplier, createSupplier, updateSupplier, deleteSupplier,
    getSupplierPayments, addPayment
} = require('../controllers/supplierController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');

router.get('/', protect, getSuppliers);
router.post('/', protect, authorize('admin', 'manager'), createSupplier);
router.get('/:id', protect, getSupplier);
router.put('/:id', protect, authorize('admin', 'manager'), updateSupplier);
router.delete('/:id', protect, authorize('admin'), deleteSupplier);
router.get('/:id/payments', protect, getSupplierPayments);
router.post('/:id/payments', protect, authorize('admin', 'manager'), addPayment);

module.exports = router;
