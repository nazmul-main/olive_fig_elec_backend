const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
    name: { type: String, required: [true, 'Name is required'], trim: true },
    email: { type: String, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    role: {
        type: String,
        enum: ['admin', 'manager', 'salesman', 'technician', 'delivery'],
        required: true,
    },
    salary: { type: Number, required: true, min: 0 },
    joinDate: { type: Date, default: Date.now },
    address: { type: String, trim: true },
    nid: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Staff', staffSchema);
