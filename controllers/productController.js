const Product = require('../models/Product');

// @route GET /api/products
exports.getProducts = async (req, res, next) => {
    try {
        const { search, brand, category, stockStatus, page = 1, limit = 20 } = req.query;
        const query = { isActive: true };
        if (search) query.$text = { $search: search };
        if (brand) query.brand = { $regex: brand, $options: 'i' };
        if (category) query.category = { $regex: category, $options: 'i' };
        if (stockStatus === 'low') query.stockQuantity = { $gt: 0, $lte: 5 };
        else if (stockStatus === 'out') query.stockQuantity = 0;
        else if (stockStatus === 'in') query.stockQuantity = { $gt: 0 };

        const skip = (Number(page) - 1) * Number(limit);
        const [products, total] = await Promise.all([
            Product.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
            Product.countDocuments(query),
        ]);
        res.json({ success: true, total, page: Number(page), pages: Math.ceil(total / limit), products });
    } catch (err) { next(err); }
};

// @route GET /api/products/:id
exports.getProduct = async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
        res.json({ success: true, product });
    } catch (err) { next(err); }
};

// @route POST /api/products
exports.createProduct = async (req, res, next) => {
    try {
        const product = await Product.create(req.body);
        res.status(201).json({ success: true, product });
    } catch (err) { next(err); }
};

// @route PUT /api/products/:id
exports.updateProduct = async (req, res, next) => {
    try {
        const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
        res.json({ success: true, product });
    } catch (err) { next(err); }
};

// @route DELETE /api/products/:id
exports.deleteProduct = async (req, res, next) => {
    try {
        const product = await Product.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
        res.json({ success: true, message: 'Product deleted' });
    } catch (err) { next(err); }
};

// @route GET /api/products/meta/filters
exports.getFilters = async (req, res, next) => {
    try {
        const [brands, categories] = await Promise.all([
            Product.distinct('brand', { isActive: true }),
            Product.distinct('category', { isActive: true }),
        ]);
        res.json({ success: true, brands, categories });
    } catch (err) { next(err); }
};
