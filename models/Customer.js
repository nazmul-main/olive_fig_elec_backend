const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
    name: { type: String, required: [true, 'Customer name is required'], trim: true },
    phone: { type: String, trim: true, unique: true, sparse: true },
    email: { type: String, trim: true },
    address: { type: String, trim: true },
    totalDue: { type: Number, default: 0 }, // Positive means customer owes us money
    totalPaid: { type: Number, default: 0 },
    lastTransactionDate: { type: Date, default: Date.now },
}, { timestamps: true });

// Index for search
customerSchema.index({ name: 'text', phone: 'text' });

module.exports = mongoose.model('Customer', customerSchema);
