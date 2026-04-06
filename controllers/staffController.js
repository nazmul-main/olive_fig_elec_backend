const Staff = require('../models/Staff');

// @route GET /api/staff
exports.getStaff = async (req, res, next) => {
    try {
        const { role, isActive } = req.query;
        const query = {};
        if (role) query.role = role;
        if (isActive !== undefined) query.isActive = isActive === 'true';
        const staff = await Staff.find(query).sort({ createdAt: -1 });
        res.json({ success: true, count: staff.length, staff });
    } catch (err) { next(err); }
};

// @route POST /api/staff
exports.createStaff = async (req, res, next) => {
    try {
        const staff = await Staff.create(req.body);
        res.status(201).json({ success: true, staff });
    } catch (err) { next(err); }
};

// @route PUT /api/staff/:id
exports.updateStaff = async (req, res, next) => {
    try {
        const staff = await Staff.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!staff) return res.status(404).json({ success: false, message: 'Staff not found' });
        res.json({ success: true, staff });
    } catch (err) { next(err); }
};

// @route DELETE /api/staff/:id
exports.deleteStaff = async (req, res, next) => {
    try {
        const staff = await Staff.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
        if (!staff) return res.status(404).json({ success: false, message: 'Staff not found' });
        res.json({ success: true, message: 'Staff deactivated' });
    } catch (err) { next(err); }
};
