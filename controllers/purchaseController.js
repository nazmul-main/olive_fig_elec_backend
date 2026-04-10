const Purchase = require('../models/Purchase');
const Product = require('../models/Product');
const Supplier = require('../models/Supplier');
const StockHistory = require('../models/StockHistory');

// @route GET /api/purchases
exports.getPurchases = async (req, res, next) => {
    try {
        const { supplier, brand, page = 1, limit = 20 } = req.query;
        const query = {};
        if (supplier) query.supplier = supplier;
        if (brand) query.brand = { $regex: brand, $options: 'i' };

        const skip = (Number(page) - 1) * Number(limit);
        const [purchases, total] = await Promise.all([
            Purchase.find(query).sort({ purchaseDate: -1 }).skip(skip).limit(Number(limit)).populate('createdBy', 'name'),
            Purchase.countDocuments(query),
        ]);
        res.json({ success: true, total, page: Number(page), pages: Math.ceil(total / limit), purchases });
    } catch (err) { next(err); }
};

// @route POST /api/purchases
// যখন purchase করবে → stock বাড়বে + supplier এর due বাড়বে
exports.createPurchase = async (req, res, next) => {
    try {
        const {
            supplierId, productCode, productName, brand, category,
            quantity, purchasePrice, salePrice, paidAmount = 0, note, purchaseDate
        } = req.body;

        if (!supplierId || !productCode || !productName || !brand || !category || !quantity || !purchasePrice || !salePrice) {
            return res.status(400).json({ success: false, message: 'All required fields must be provided' });
        }

        const supplier = await Supplier.findById(supplierId);
        if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found' });

        const totalAmount = quantity * purchasePrice;
        if (paidAmount > totalAmount) {
            return res.status(400).json({ success: false, message: 'Paid amount cannot exceed total amount' });
        }

        // Find existing product by code (case-insensitive) or create new one
        let product = await Product.findOne({ code: { $regex: `^${productCode}$`, $options: 'i' }, isActive: true });

        if (product) {
            // Update existing product prices and increase stock
            const prevStock = product.stockQuantity;
            product.stockQuantity += quantity;
            product.purchasePrice = purchasePrice; // Update to latest purchase price
            product.salePrice = salePrice;          // Update to latest sale price
            await product.save();

            // Stock history
            await StockHistory.create({
                product: product._id,
                productName: product.name,
                type: 'IN',
                quantity,
                reason: 'purchase',
                previousStock: prevStock,
                newStock: product.stockQuantity,
                note: `Purchase from ${supplier.name}`,
                updatedBy: req.user._id,
            });
        } else {
            // Create new product
            product = await Product.create({
                name: productName,
                code: productCode.toUpperCase(),
                brand,
                category,
                purchasePrice,
                salePrice,
                stockQuantity: quantity,
                supplierName: supplier.name,
            });

            // Stock history for new product
            await StockHistory.create({
                product: product._id,
                productName: product.name,
                type: 'IN',
                quantity,
                reason: 'purchase',
                previousStock: 0,
                newStock: quantity,
                note: `Initial purchase from ${supplier.name}`,
                updatedBy: req.user._id,
            });
        }

        // Create purchase record
        const purchase = await Purchase.create({
            supplier: supplier._id,
            supplierName: supplier.name,
            product: product._id,
            productName: product.name,
            productCode: product.code,
            brand,
            category,
            quantity,
            purchasePrice,
            salePrice,
            totalAmount,
            paidAmount,
            purchaseDate: purchaseDate || new Date(),
            note,
            createdBy: req.user._id,
        });

        // Update supplier financials
        supplier.totalPurchased += totalAmount;
        supplier.totalPaid += paidAmount;
        await supplier.save();

        res.status(201).json({ success: true, purchase, product });
    } catch (err) { next(err); }
};

// @route GET /api/purchases/by-supplier/:supplierId
exports.getPurchasesBySupplier = async (req, res, next) => {
    try {
        const purchases = await Purchase.find({ supplier: req.params.supplierId })
            .sort({ purchaseDate: -1 })
            .populate('createdBy', 'name');
        res.json({ success: true, purchases });
    } catch (err) { next(err); }
};
