const Supplier = require('../models/Supplier');
const SupplierPayment = require('../models/SupplierPayment');
const User = require('../models/User');

// @route GET /api/suppliers
exports.getSuppliers = async (req, res, next) => {
    try {
        const suppliers = await Supplier.find({ isActive: true }).sort({ name: 1 });
        res.json({ success: true, suppliers });
    } catch (err) { next(err); }
};

// @route GET /api/suppliers/:id
exports.getSupplier = async (req, res, next) => {
    try {
        const supplier = await Supplier.findById(req.params.id);
        if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found' });
        res.json({ success: true, supplier });
    } catch (err) { next(err); }
};

// @route POST /api/suppliers
exports.createSupplier = async (req, res, next) => {
    try {
        const supplier = await Supplier.create(req.body);
        res.status(201).json({ success: true, supplier });
    } catch (err) { next(err); }
};

// @route PUT /api/suppliers/:id
exports.updateSupplier = async (req, res, next) => {
    try {
        const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found' });
        res.json({ success: true, supplier });
    } catch (err) { next(err); }
};

// @route DELETE /api/suppliers/:id  (soft delete with admin password)
exports.deleteSupplier = async (req, res, next) => {
    try {
        const { password } = req.body;
        if (!password) return res.status(400).json({ success: false, message: 'Admin password required' });
        const admin = await User.findById(req.user._id).select('+password');
        const isMatch = await admin.comparePassword(password);
        if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid admin password' });

        const supplier = await Supplier.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
        if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found' });
        res.json({ success: true, message: 'Supplier deleted' });
    } catch (err) { next(err); }
};

// @route GET /api/suppliers/:id/payments  (payment history for a supplier)
exports.getSupplierPayments = async (req, res, next) => {
    try {
        const payments = await SupplierPayment.find({ supplier: req.params.id })
            .sort({ paymentDate: -1 })
            .populate('createdBy', 'name');
        res.json({ success: true, payments });
    } catch (err) { next(err); }
};

// @route POST /api/suppliers/:id/payments  (add payment to a supplier)
exports.addPayment = async (req, res, next) => {
    try {
        const supplier = await Supplier.findById(req.params.id);
        if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found' });

        const { amount, note, paymentDate } = req.body;
        if (!amount || amount <= 0) return res.status(400).json({ success: false, message: 'Valid amount required' });

        const due = supplier.totalPurchased - supplier.totalPaid;
        if (amount > due) return res.status(400).json({ success: false, message: `Amount exceeds due amount of ৳${due}` });

        // Create payment record
        const payment = await SupplierPayment.create({
            supplier: supplier._id,
            supplierName: supplier.name,
            amount,
            note,
            paymentDate: paymentDate || new Date(),
            createdBy: req.user._id,
        });

        // Update supplier's totalPaid
        supplier.totalPaid += amount;
        await supplier.save();

        res.status(201).json({ success: true, payment, supplier });
    } catch (err) { next(err); }
};
