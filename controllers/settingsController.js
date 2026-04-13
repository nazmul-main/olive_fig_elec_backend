const Setting = require('../models/Setting');

// Get current settings (creates default if none exists)
exports.getSettings = async (req, res) => {
    try {
        let settings = await Setting.findOne();
        if (!settings) {
            settings = await Setting.create({});
        }
        res.status(200).json({ success: true, settings });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update settings (Admin only)
exports.updateSettings = async (req, res) => {
    try {
        let settings = await Setting.findOne();
        if (!settings) {
            settings = new Setting();
        }

        const { businessName, phone, email, address, vatPercentage, logoUrl, currency } = req.body;
        
        if (businessName) settings.businessName = businessName;
        if (phone) settings.phone = phone;
        if (email) settings.email = email;
        if (address) settings.address = address;
        if (vatPercentage !== undefined) settings.vatPercentage = vatPercentage;
        if (logoUrl) settings.logoUrl = logoUrl;
        if (currency) settings.currency = currency;

        await settings.save();
        res.status(200).json({ success: true, message: 'Settings updated successfully', settings });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
