const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
    name: { type: String, required: [true, 'Supplier name is required'], trim: true },
    contactPerson: { type: String, trim: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    email: { type: String, trim: true },
    totalPurchased: { type: Number, default: 0 },  // মোট কেনার পরিমাণ
    totalPaid: { type: Number, default: 0 },         // মোট পরিশোধ করা
    // totalDue = totalPurchased - totalPaid (calculated)
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

supplierSchema.virtual('totalDue').get(function () {
    return this.totalPurchased - this.totalPaid;
});

supplierSchema.set('toJSON', { virtuals: true });
supplierSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Supplier', supplierSchema);
