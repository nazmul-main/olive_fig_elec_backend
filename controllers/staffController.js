const Staff = require('../models/Staff');
const User = require('../models/User');

// @route GET /api/staff
exports.getStaff = async function(req, res, next) {
    try {
        const { role, isActive } = req.query;
        const query = {};
        if (role) query.role = role;
        if (isActive !== undefined) query.isActive = isActive === 'true';
        const staff = await Staff.find(query).sort({ createdAt: -1 });
        res.json({ success: true, count: staff.length, staff });
    } catch (err) {
        if (typeof next === 'function') next(err);
        else res.status(500).json({ success: false, message: err.message });
    }
};

// @route POST /api/staff
exports.createStaff = async function(req, res, next) {
    try {
        const staff = await Staff.create(req.body);
        res.status(201).json({ success: true, staff });
    } catch (err) {
        if (typeof next === 'function') next(err);
        else res.status(500).json({ success: false, message: err.message });
    }
};

// @route PUT /api/staff/:id
exports.updateStaff = async function(req, res, next) {
    try {
        const staff = await Staff.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!staff) return res.status(404).json({ success: false, message: 'Staff not found' });
        res.json({ success: true, staff });
    } catch (err) {
        if (typeof next === 'function') next(err);
        else res.status(500).json({ success: false, message: err.message });
    }
};

// @route DELETE /api/staff/:id
exports.deleteStaff = async function(req, res, next) {
    try {
        const { password } = req.body;
        if (!password) return res.status(400).json({ success: false, message: 'Admin password required' });

        // Verify admin password
        const admin = await User.findById(req.user._id).select('+password');
        const isMatch = await admin.comparePassword(password);
        if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid admin password' });

        const staff = await Staff.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
        if (!staff) return res.status(404).json({ success: false, message: 'Staff not found' });
        res.json({ success: true, message: 'Staff deactivated' });
    } catch (err) {
        if (typeof next === 'function') next(err);
        else res.status(500).json({ success: false, message: err.message });
    }
};
