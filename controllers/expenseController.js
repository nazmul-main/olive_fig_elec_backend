const Expense = require('../models/Expense');

// @route GET /api/expenses
exports.getExpenses = async (req, res, next) => {
    try {
        const { category, startDate, endDate, page = 1, limit = 20 } = req.query;
        const query = {};
        if (category) query.category = category;
        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(new Date(endDate).setHours(23, 59, 59));
        }
        const skip = (Number(page) - 1) * Number(limit);
        const [expenses, total] = await Promise.all([
            Expense.find(query).populate('addedBy', 'name').sort({ date: -1 }).skip(skip).limit(Number(limit)),
            Expense.countDocuments(query),
        ]);
        // Monthly total
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthlyAgg = await Expense.aggregate([
            { $match: { date: { $gte: monthStart } } },
            { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);
        const monthlyTotal = monthlyAgg[0]?.total || 0;
        res.json({ success: true, total, page: Number(page), pages: Math.ceil(total / limit), monthlyTotal, expenses });
    } catch (err) { next(err); }
};

// @route POST /api/expenses
exports.createExpense = async (req, res, next) => {
    try {
        const expense = await Expense.create({ ...req.body, addedBy: req.user._id });
        res.status(201).json({ success: true, expense });
    } catch (err) { next(err); }
};

// @route PUT /api/expenses/:id
exports.updateExpense = async (req, res, next) => {
    try {
        const expense = await Expense.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });
        res.json({ success: true, expense });
    } catch (err) { next(err); }
};

// @route DELETE /api/expenses/:id
exports.deleteExpense = async (req, res, next) => {
    try {
        const expense = await Expense.findByIdAndDelete(req.params.id);
        if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });
        res.json({ success: true, message: 'Expense deleted' });
    } catch (err) { next(err); }
};
