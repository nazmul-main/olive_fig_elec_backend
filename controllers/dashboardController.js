const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Expense = require('../models/Expense');
const StockHistory = require('../models/StockHistory');

// @route GET /api/dashboard
exports.getDashboardStats = async (req, res, next) => {
    try {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        const [
            todaySalesAgg, monthlySalesAgg,
            monthlyExpensesAgg,
            totalProducts, lowStockProducts,
            recentSales,
        ] = await Promise.all([
            Sale.aggregate([{ $match: { saleDate: { $gte: todayStart } } }, { $group: { _id: null, total: { $sum: '$grandTotal' }, count: { $sum: 1 } } }]),
            Sale.aggregate([{ $match: { saleDate: { $gte: monthStart } } }, { $group: { _id: null, total: { $sum: '$grandTotal' }, profit: { $sum: { $subtract: ['$grandTotal', { $sum: { $map: { input: '$items', as: 'i', in: { $multiply: ['$$i.purchasePrice', '$$i.quantity'] } } } }] } }, count: { $sum: 1 } } }]),
            Expense.aggregate([{ $match: { date: { $gte: monthStart } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
            Product.countDocuments({ isActive: true }),
            Product.find({ isActive: true, stockQuantity: { $lte: 5 } }).limit(10).select('name code stockQuantity'),
            Sale.find().populate('soldBy', 'name').sort({ saleDate: -1 }).limit(8),
        ]);

        // Stock value
        const stockValueAgg = await Product.aggregate([
            { $match: { isActive: true } },
            { $group: { _id: null, value: { $sum: { $multiply: ['$purchasePrice', '$stockQuantity'] } } } },
        ]);

        // Chart Data (Last 7 Days)
        const sevenDaysAgo = new Date(todayStart);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

        const dailySalesAgg = await Sale.aggregate([
            { $match: { saleDate: { $gte: sevenDaysAgo } } },
            { 
                $group: { 
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$saleDate" } }, 
                    revenue: { $sum: '$grandTotal' } 
                } 
            },
            { $sort: { _id: 1 } }
        ]);

        const dailyExpensesAgg = await Expense.aggregate([
            { $match: { date: { $gte: sevenDaysAgo } } },
            { 
                $group: { 
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } }, 
                    amount: { $sum: '$amount' } 
                } 
            },
            { $sort: { _id: 1 } }
        ]);

        // Merge chart data
        const chartData = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(sevenDaysAgo);
            d.setDate(d.getDate() + i);
            const dateStr = d.toISOString().split('T')[0];
            const rev = dailySalesAgg.find(x => x._id === dateStr)?.revenue || 0;
            const exp = dailyExpensesAgg.find(x => x._id === dateStr)?.amount || 0;
            const shortDate = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
            chartData.push({ name: shortDate, revenue: rev, expenses: exp });
        }

        res.json({
            success: true,
            stats: {
                todayRevenue: todaySalesAgg[0]?.total || 0,
                todaySalesCount: todaySalesAgg[0]?.count || 0,
                monthlyRevenue: monthlySalesAgg[0]?.total || 0,
                monthlySalesCount: monthlySalesAgg[0]?.count || 0,
                monthlyProfit: (monthlySalesAgg[0]?.profit || 0) - (monthlyExpensesAgg[0]?.total || 0),
                monthlyExpenses: monthlyExpensesAgg[0]?.total || 0,
                totalProducts,
                stockValue: stockValueAgg[0]?.value || 0,
            },
            lowStockProducts,
            recentSales,
            chartData
        });
    } catch (err) { next(err); }
};

// @route GET /api/dashboard/inventory
exports.getInventoryStats = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, startDate, endDate } = req.query;
        const query = {};

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(new Date(endDate).setHours(23, 59, 59));
        }

        const skip = (Number(page) - 1) * Number(limit);
        const [history, total] = await Promise.all([
            StockHistory.find(query).populate('product', 'name code').populate('updatedBy', 'name').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
            StockHistory.countDocuments(query),
        ]);
        res.json({ success: true, total, page: Number(page), pages: Math.ceil(total / Number(limit)), history });
    } catch (err) { next(err); }
};

// @route POST /api/dashboard/stock-adjustment
exports.adjustStock = async (req, res, next) => {
    try {
        const { productId, quantity, type, reason, note } = req.body;
        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
        const previousStock = product.stockQuantity;
        const adjustment = type === 'IN' ? quantity : -quantity;
        const newStock = previousStock + adjustment;
        if (newStock < 0) return res.status(400).json({ success: false, message: 'Stock cannot be negative' });
        await Product.findByIdAndUpdate(productId, { stockQuantity: newStock });
        await StockHistory.create({ product: productId, productName: product.name, type, quantity, reason: reason || 'adjustment', previousStock, newStock, note, updatedBy: req.user._id });
        res.json({ success: true, message: 'Stock adjusted', newStock });
    } catch (err) { next(err); }
};
