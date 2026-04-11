const Sale = require('../models/Sale');
const Product = require('../models/Product');
const StockHistory = require('../models/StockHistory');
const User = require('../models/User');
const Customer = require('../models/Customer');
const generateInvoiceNo = require('../utils/generateInvoiceNo');

// @route POST /api/sales
exports.createSale = async (req, res, next) => {
    try {
        const { 
            customer, // ID (not guaranteed now as we might search by phone)
            customerName, 
            customerPhone, 
            customerEmail,
            customerAddress,
            items, 
            discount = 0, 
            vat = 0, 
            paidAmount = 0,
            paymentMethod, 
            note 
        } = req.body;

        // ... validation logic omitted for brevity in target content matching ...
        // ... handled in ReplacementContent ...

        // Determine Customer (Existing or New)
        let customerId = customer;
        if (!customerId && customerPhone) {
            let foundCustomer = await Customer.findOne({ phone: customerPhone });
            if (foundCustomer) {
                customerId = foundCustomer._id;
            } else if (customerName && customerName !== 'Walk-in Customer') {
                // Create new customer automatically
                const newCustomer = await Customer.create({
                    name: customerName,
                    phone: customerPhone,
                    email: customerEmail,
                    address: customerAddress
                });
                customerId = newCustomer._id;
            }
        }

        // Validate and process items
        let subtotal = 0;
        const processedItems = [];

        for (const item of items) {
            const product = await Product.findById(item.product);
            if (!product) return res.status(404).json({ success: false, message: `Product not found: ${item.product}` });
            
            if (product.stockQuantity < item.quantity) {
                return res.status(400).json({ success: false, message: `Insufficient stock for ${product.name}. Available: ${product.stockQuantity}` });
            }

            const itemSubtotal = product.salePrice * item.quantity;
            subtotal += itemSubtotal;
            
            processedItems.push({
                product: product._id,
                productName: product.name,
                code: product.code,
                quantity: item.quantity,
                purchasePrice: product.purchasePrice,
                salePrice: product.salePrice,
                subtotal: itemSubtotal,
                serialNumbers: item.serialNumbers || [],
            });
        }

        const vatAmount = ((subtotal - discount) * vat) / 100;
        const grandTotal = subtotal - discount + vatAmount;
        const dueAmount = grandTotal - paidAmount;
        const invoiceNo = await generateInvoiceNo();

        const sale = await Sale.create({
            invoiceNo, 
            customer: customerId,
            customerName, 
            customerPhone, 
            customerEmail,
            customerAddress,
            items: processedItems,
            subtotal, 
            discount, 
            vat, 
            vatAmount, 
            grandTotal, 
            paidAmount,
            dueAmount,
            paymentMethod, 
            note,
            soldBy: req.user._id,
        });

        // Update customer ledger
        if (customerId) {
            await Customer.findByIdAndUpdate(customerId, {
                $inc: { 
                    totalDue: dueAmount,
                    totalPaid: paidAmount 
                },
                $set: { lastTransactionDate: Date.now() }
            });
        }

        // Deduct stock and record history
        for (const item of processedItems) {
            const product = await Product.findById(item.product);
            const previousStock = product.stockQuantity;
            const newStock = previousStock - item.quantity;
            
            await Product.findByIdAndUpdate(item.product, { $inc: { stockQuantity: -item.quantity } });
            
            await StockHistory.create({
                product: item.product, 
                productName: item.productName, 
                type: 'OUT',
                quantity: item.quantity, 
                reason: 'sale', 
                previousStock, 
                newStock,
                updatedBy: req.user._id,
            });
        }

        const populatedSale = await Sale.findById(sale._id).populate('soldBy', 'name').populate('customer', 'name phone');
        res.status(201).json({ success: true, sale: populatedSale });
    } catch (err) { next(err); }
};

// @route GET /api/sales
exports.getSales = async (req, res, next) => {
    try {
        const { startDate, endDate, paymentMethod, customer, page = 1, limit = 20 } = req.query;
        const query = {};
        
        if (startDate || endDate) {
            query.saleDate = {};
            if (startDate) query.saleDate.$gte = new Date(startDate);
            if (endDate) query.saleDate.$lte = new Date(new Date(endDate).setHours(23, 59, 59));
        }
        
        if (paymentMethod) query.paymentMethod = paymentMethod;
        if (customer) query.customer = customer;

        const skip = (Number(page) - 1) * Number(limit);
        const [sales, total] = await Promise.all([
            Sale.find(query)
                .populate('soldBy', 'name')
                .populate('customer', 'name phone')
                .sort({ saleDate: -1 })
                .skip(skip)
                .limit(Number(limit)),
            Sale.countDocuments(query),
        ]);
        
        res.json({ success: true, total, page: Number(page), pages: Math.ceil(total / limit), sales });
    } catch (err) { next(err); }
};

// @route GET /api/sales/:id
exports.getSale = async (req, res, next) => {
    try {
        const sale = await Sale.findById(req.params.id)
            .populate('soldBy', 'name email')
            .populate('customer', 'name phone address email totalDue');
            
        if (!sale) return res.status(404).json({ success: false, message: 'Sale not found' });
        res.json({ success: true, sale });
    } catch (err) { next(err); }
};

// @route DELETE /api/sales/:id
exports.deleteSale = async (req, res, next) => {
    try {
        const { password } = req.body;
        if (!password) return res.status(400).json({ success: false, message: 'Admin password required' });

        // Verify admin password
        const admin = await User.findById(req.user._id).select('+password');
        const isMatch = await admin.comparePassword(password);
        if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid admin password' });

        const sale = await Sale.findById(req.params.id);
        if (!sale) return res.status(404).json({ success: false, message: 'Sale not found' });

        // Restore Customer Ledger if exists
        if (sale.customer) {
            await Customer.findByIdAndUpdate(sale.customer, {
                $inc: { 
                    totalDue: -sale.dueAmount,
                    totalPaid: -sale.paidAmount 
                }
            });
        }

        // Restore Stock
        for (const item of sale.items) {
            const product = await Product.findById(item.product);
            if (product) {
                const previousStock = product.stockQuantity;
                const newStock = previousStock + item.quantity;
                await Product.findByIdAndUpdate(item.product, { $inc: { stockQuantity: item.quantity } });
                await StockHistory.create({
                    product: item.product, productName: item.productName, type: 'IN',
                    quantity: item.quantity, reason: 'sale_deleted',
                    previousStock, newStock, updatedBy: req.user._id,
                });
            }
        }

        await Sale.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Sale deleted, stock restored and customer ledger updated' });
    } catch (err) { next(err); }
};
