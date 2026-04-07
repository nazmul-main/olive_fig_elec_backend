const mongoose = require('mongoose');

const stockHistorySchema = new mongoose.Schema({
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: { type: String, required: true },
    type: { type: String, enum: ['IN', 'OUT'], required: true },
    quantity: { type: Number, required: true, min: 1 },
    reason: {
        type: String,
        enum: ['purchase', 'sale', 'adjustment', 'return', 'damage', 'sale_deleted'],
        required: true,
    },
    previousStock: { type: Number, required: true },
    newStock: { type: Number, required: true },
    note: { type: String, trim: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now },
}, { timestamps: false });

module.exports = mongoose.model('StockHistory', stockHistorySchema);
