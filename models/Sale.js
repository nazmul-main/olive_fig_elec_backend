const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema({
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: { type: String, required: true },
    code: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    purchasePrice: { type: Number, required: true },
    salePrice: { type: Number, required: true },
    subtotal: { type: Number, required: true },
}, { _id: false });

const saleSchema = new mongoose.Schema({
    invoiceNo: { type: String, unique: true, required: true },
    customerName: { type: String, trim: true, default: 'Walk-in Customer' },
    customerPhone: { type: String, trim: true },
    items: [saleItemSchema],
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    vat: { type: Number, default: 0 },           // percentage
    vatAmount: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },
    paymentMethod: {
        type: String,
        enum: ['cash', 'bkash', 'nagad', 'card'],
        default: 'cash',
    },
    soldBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    note: { type: String, trim: true },
    saleDate: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Sale', saleSchema);
