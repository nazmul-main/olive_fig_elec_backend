const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { type: String, required: [true, 'Product name is required'], trim: true },
    code: {
        type: String,
        required: [true, 'Product code is required'],
        unique: true,
        uppercase: true,
        trim: true,
    },
    brand: { type: String, required: [true, 'Brand is required'], trim: true },
    category: { type: String, required: [true, 'Category is required'], trim: true },
    purchasePrice: { type: Number, required: [true, 'Purchase price is required'], min: 0 },
    salePrice: { type: Number, required: [true, 'Sale price is required'], min: 0 },
    stockQuantity: { type: Number, required: true, default: 0, min: 0 },
    supplierName: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

// Text index for search
productSchema.index({ name: 'text', code: 'text', brand: 'text' });

module.exports = mongoose.model('Product', productSchema);
