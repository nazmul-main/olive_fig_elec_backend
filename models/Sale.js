const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema({
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: { type: String, required: true },
    code: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    purchasePrice: { type: Number, required: true },
    salePrice: { type: Number, required: true },
    subtotal: { type: Number, required: true },
    serialNumbers: [{ type: String, trim: true }], // Array of serial/IMEI strings
}, { _id: false });

const saleSchema = new mongoose.Schema({
    invoiceNo: { type: String, unique: true, required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' }, // Reference to Customer model
    customerName: { type: String, trim: true, default: 'Walk-in Customer', index: true },
    customerPhone: { type: String, trim: true, index: true },
    customerEmail: { type: String, trim: true },
    customerAddress: { type: String, trim: true },
    items: [saleItemSchema],
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    vat: { type: Number, default: 0 },           // percentage
    vatAmount: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },
    paidAmount: { type: Number, default: 0, min: 0 }, // Amount paid during sale
    dueAmount: { type: Number, default: 0 },          // grandTotal - paidAmount
    paymentMethod: {
        type: String,
        enum: ['cash', 'bkash', 'nagad', 'card'],
        default: 'cash',
    },
    soldBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    note: { type: String, trim: true },
    saleDate: { type: Date, default: Date.now, index: true },
}, { timestamps: true });

module.exports = mongoose.model('Sale', saleSchema);
