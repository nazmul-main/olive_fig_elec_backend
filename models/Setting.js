const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
    businessName: { type: String, default: 'Olive & Fig Electronics' },
    phone: { type: String, default: '+880 1234 567890' },
    email: { type: String, default: 'info@oliveandfig.com' },
    address: { type: String, default: 'Dhaka, Bangladesh' },
    vatPercentage: { type: Number, default: 0 },
    logoUrl: { type: String, default: '/only-logo.png' },
    currency: { type: String, default: '৳' },
}, { timestamps: true });

module.exports = mongoose.model('Setting', settingSchema);
