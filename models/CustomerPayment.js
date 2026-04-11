const mongoose = require('mongoose');

const customerPaymentSchema = new mongoose.Schema({
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    amount: { type: Number, required: true, min: 0 },
    paymentMethod: {
        type: String,
        enum: ['cash', 'bkash', 'nagad', 'card'],
        required: true,
    },
    paymentDate: { type: Date, default: Date.now },
    note: { type: String, trim: true },
    receivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

module.exports = mongoose.model('CustomerPayment', customerPaymentSchema);
