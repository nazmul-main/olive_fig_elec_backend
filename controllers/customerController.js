const Customer = require('../models/Customer');
const CustomerPayment = require('../models/CustomerPayment');
const Sale = require('../models/Sale');
const User = require('../models/User');

// @route POST /api/customers
exports.createCustomer = async (req, res, next) => {
    try {
        const customer = await Customer.create(req.body);
        res.status(201).json({ success: true, customer });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ success: false, message: 'Phone number already exists' });
        }
        next(err);
    }
};

// @route GET /api/customers
exports.getCustomers = async (req, res, next) => {
    try {
        const { search, page = 1, limit = 50 } = req.query;
        const query = {};
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (Number(page) - 1) * Number(limit);
        const [customers, total] = await Promise.all([
            Customer.find(query).sort({ name: 1 }).skip(skip).limit(Number(limit)),
            Customer.countDocuments(query)
        ]);

        res.json({ success: true, total, page: Number(page), pages: Math.ceil(total / limit), customers });
    } catch (err) { next(err); }
};

// @route GET /api/customers/:id
exports.getCustomer = async (req, res, next) => {
    try {
        const customer = await Customer.findById(req.params.id);
        if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

        const sales = await Sale.find({ customer: customer._id }).sort({ saleDate: -1 }).limit(10);
        const payments = await CustomerPayment.find({ customer: customer._id }).sort({ paymentDate: -1 }).limit(10);

        res.json({ success: true, customer, sales, payments });
    } catch (err) { next(err); }
};

// @route PUT /api/customers/:id
exports.updateCustomer = async (req, res, next) => {
    try {
        const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
        res.json({ success: true, customer });
    } catch (err) { next(err); }
};

// @route POST /api/customers/:id/payments
exports.addPayment = async (req, res, next) => {
    try {
        const { amount, paymentMethod, note } = req.body;
        const customerId = req.params.id;

        const customer = await Customer.findById(customerId);
        if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

        if (amount > customer.totalDue) {
            return res.status(400).json({ 
                success: false, 
                message: `Payment amount (৳${amount}) cannot exceed the total due (৳${customer.totalDue})` 
            });
        }

        const payment = await CustomerPayment.create({
            customer: customerId,
            amount,
            paymentMethod,
            note,
            receivedBy: req.user._id
        });

        // Update customer balance
        // Note: amount reduces totalDue and increases totalPaid
        customer.totalDue -= amount;
        customer.totalPaid += Number(amount);
        customer.lastTransactionDate = Date.now();
        await customer.save();

        res.status(201).json({ success: true, payment, customer });
    } catch (err) { next(err); }
};

// @route GET /api/customers/:id/history
exports.getCustomerHistory = async (req, res, next) => {
    try {
        const customerId = req.params.id;
        const [sales, payments] = await Promise.all([
            Sale.find({ customer: customerId }).sort({ saleDate: -1 }),
            CustomerPayment.find({ customer: customerId }).sort({ paymentDate: -1 })
        ]);

        // Merge and sort by date for a ledger view
        const history = [
            ...sales.map(s => ({ ...s._doc, type: 'SALE', date: s.saleDate })),
            ...payments.map(p => ({ ...p._doc, type: 'PAYMENT', date: p.paymentDate }))
        ].sort((a, b) => b.date - a.date);

        res.json({ success: true, history });
    } catch (err) { next(err); }
};

// @route DELETE /api/customers/:id
exports.deleteCustomer = async (req, res, next) => {
    try {
        const { password } = req.body;
        if (!password) return res.status(400).json({ success: false, message: 'Admin password required' });

        // Ensure only admin can delete
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Only admins can delete customers' });
        }

        // Verify admin password
        const admin = await User.findById(req.user._id).select('+password');
        const isMatch = await admin.comparePassword(password);
        if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid administrative password' });

        const customer = await Customer.findById(req.params.id);
        if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

        await Customer.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Customer deleted successfully' });
    } catch (err) { next(err); }
};
