const mongoose = require('mongoose');

const supplierPaymentSchema = new mongoose.Schema({
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
    supplierName: { type: String, required: true },
    amount: { type: Number, required: true, min: 1 },
    paymentDate: { type: Date, default: Date.now },
    note: { type: String, trim: true }, // যেমন: "Samsung এর মার্চ মাসের কিস্তি"
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

module.exports = mongoose.model('SupplierPayment', supplierPaymentSchema);
