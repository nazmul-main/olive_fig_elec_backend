const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
    title: { type: String, required: [true, 'Title is required'], trim: true },
    amount: { type: Number, required: [true, 'Amount is required'], min: 0 },
    category: {
        type: String,
        enum: ['salary', 'electricity', 'rent', 'maintenance', 'marketing', 'others'],
        required: true,
        index: true
    },
    date: { type: Date, required: true, default: Date.now, index: true },
    note: { type: String, trim: true },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

module.exports = mongoose.model('Expense', expenseSchema);
