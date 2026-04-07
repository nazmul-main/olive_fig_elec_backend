const jwt = require('jsonwebtoken');
const User = require('../models/User');

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });

// @route POST /api/auth/register
exports.register = async function(req, res, next) {
    try {
        const { name, email, password, role } = req.body;
        const user = new User({ name, email, password, role });
        await user.save();
        const token = signToken(user._id);
        res.status(201).json({ success: true, token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
    } catch (err) {
        if (typeof next === 'function') next(err);
        else res.status(500).json({ success: false, message: err.message });
    }
};

// @route POST /api/auth/login
exports.login = async function(req, res, next) {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required' });
        const user = await User.findOne({ email }).select('+password');
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }
        if (!user.isActive) return res.status(401).json({ success: false, message: 'Account is deactivated' });
        const token = signToken(user._id);
        res.json({ success: true, token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
    } catch (err) {
        if (typeof next === 'function') next(err);
        else res.status(500).json({ success: false, message: err.message });
    }
};

// @route GET /api/auth/me
exports.getMe = async (req, res, next) => {
    try {
        res.json({ success: true, user: req.user });
    } catch (err) {
        if (typeof next === 'function') next(err);
        else res.status(500).json({ success: false, message: err.message });
    }
};

// @route GET /api/auth/users  (admin only)
exports.getUsers = async (req, res, next) => {
    try {
        const users = await User.find().sort({ createdAt: -1 });
        res.json({ success: true, count: users.length, users });
    } catch (err) {
        if (typeof next === 'function') next(err);
        else res.status(500).json({ success: false, message: err.message });
    }
};

// @route PATCH /api/auth/users/:id/toggle
exports.toggleUser = async (req, res, next) => {
    try {
        const { password } = req.body;
        if (!password) return res.status(400).json({ success: false, message: 'Admin password required' });

        // Verify admin password
        const admin = await User.findById(req.user._id).select('+password');
        const isMatch = await admin.comparePassword(password);
        if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid admin password' });

        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        
        user.isActive = !user.isActive;
        await user.save();
        res.json({ success: true, message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully` });
    } catch (err) {
        if (typeof next === 'function') next(err);
        else res.status(500).json({ success: false, message: err.message });
    }
};

// @route PUT /api/auth/users/:id
exports.updateUser = async function(req, res, next) {
    try {
        const { name, email, password, role, adminPassword } = req.body;
        if (!adminPassword) return res.status(400).json({ success: false, message: 'Admin password required' });

        // Verify admin password
        const admin = await User.findById(req.user._id).select('+password');
        const isMatch = await admin.comparePassword(adminPassword);
        if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid admin password' });

        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        // Update fields if they exist
        if (name) user.name = name;
        if (email) user.email = email;
        if (role) user.role = role;
        if (password) user.password = password; // pre-save hook will hash it

        await user.save();
        res.json({ success: true, message: 'User updated successfully' });
    } catch (err) {
        if (typeof next === 'function') next(err);
        else res.status(500).json({ success: false, message: err.message });
    }
};
