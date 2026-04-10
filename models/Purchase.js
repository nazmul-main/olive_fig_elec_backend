const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema({
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
    supplierName: { type: String, required: true }, // denormalized for history
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: { type: String, required: true },
    productCode: { type: String, required: true },
    brand: { type: String, required: true },
    category: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    purchasePrice: { type: Number, required: true, min: 0 }, // প্রতি পিস দাম
    salePrice: { type: Number, required: true, min: 0 },     // বিক্রয় মূল্য
    totalAmount: { type: Number, required: true },            // quantity * purchasePrice
    paidAmount: { type: Number, default: 0, min: 0 },        // প্রথমে কত দিলে
    // dueAmount = totalAmount - paidAmount (calculated)
    purchaseDate: { type: Date, default: Date.now },
    note: { type: String, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

purchaseSchema.virtual('dueAmount').get(function () {
    return this.totalAmount - this.paidAmount;
});

purchaseSchema.set('toJSON', { virtuals: true });
purchaseSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Purchase', purchaseSchema);
