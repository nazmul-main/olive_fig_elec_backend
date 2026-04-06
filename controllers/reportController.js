const Sale = require('../models/Sale');
const Expense = require('../models/Expense');
const Product = require('../models/Product');

// @route GET /api/reports/sales?startDate=&endDate=
exports.getSalesReport = async (req, res, next) => {
    try {
        const { startDate, endDate, groupBy = 'day' } = req.query;
        const match = {};
        if (startDate) match.saleDate = { $gte: new Date(startDate) };
        if (endDate) match.saleDate = { ...match.saleDate, $lte: new Date(new Date(endDate).setHours(23, 59, 59)) };

        const groupFormat = groupBy === 'month'
            ? { year: { $year: '$saleDate' }, month: { $month: '$saleDate' } }
            : { year: { $year: '$saleDate' }, month: { $month: '$saleDate' }, day: { $dayOfMonth: '$saleDate' } };

        const salesData = await Sale.aggregate([
            { $match: match },
            { $group: { _id: groupFormat, revenue: { $sum: '$grandTotal' }, count: { $sum: 1 }, discount: { $sum: '$discount' }, purchaseCost: { $sum: { $sum: { $map: { input: '$items', as: 'i', in: { $multiply: ['$$i.purchasePrice', '$$i.quantity'] } } } } } } },
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
        ]);

        const totalRevenue = salesData.reduce((a, b) => a + b.revenue, 0);
        const totalCost = salesData.reduce((a, b) => a + b.purchaseCost, 0);

        // Expense total for period
        const expAgg = await Expense.aggregate([
            { $match: match.saleDate ? { date: match.saleDate } : {} },
            { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);
        const totalExpenses = expAgg[0]?.total || 0;

        res.json({
            success: true,
            summary: {
                totalRevenue, totalCost, totalExpenses,
                grossProfit: totalRevenue - totalCost,
                netProfit: totalRevenue - totalCost - totalExpenses,
            },
            data: salesData,
        });
    } catch (err) { next(err); }
};

// @route GET /api/reports/stock
exports.getStockReport = async (req, res, next) => {
    try {
        const products = await Product.find({ isActive: true }).sort({ stockQuantity: 1 });
        const stockValue = products.reduce((acc, p) => acc + (p.purchasePrice * p.stockQuantity), 0);
        const lowStock = products.filter(p => p.stockQuantity <= 5);
        const outOfStock = products.filter(p => p.stockQuantity === 0);
        res.json({ success: true, stockValue, totalProducts: products.length, lowStockCount: lowStock.length, outOfStockCount: outOfStock.length, products });
    } catch (err) { next(err); }
};

// @route GET /api/reports/expenses
exports.getExpenseReport = async (req, res, next) => {
    try {
        const { year = new Date().getFullYear(), month } = req.query;
        const match = { date: { $gte: new Date(`${year}-01-01`), $lte: new Date(`${year}-12-31T23:59:59`) } };
        if (month) { match.date = { $gte: new Date(`${year}-${month}-01`), $lte: new Date(new Date(`${year}-${month}-01`).setMonth(Number(month))) }; }

        const byCategory = await Expense.aggregate([
            { $match: match },
            { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
            { $sort: { total: -1 } },
        ]);
        const grandTotal = byCategory.reduce((a, b) => a + b.total, 0);
        res.json({ success: true, grandTotal, byCategory });
    } catch (err) { next(err); }
};
