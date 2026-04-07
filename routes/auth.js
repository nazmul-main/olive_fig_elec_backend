const express = require('express');
const router = express.Router();
const { register, login, getMe, getUsers, toggleUser, updateUser } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');

router.post('/register', protect, authorize('admin'), register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.get('/users', protect, authorize('admin'), getUsers);
router.patch('/users/:id/toggle', protect, authorize('admin'), toggleUser);
router.put('/users/:id', protect, authorize('admin'), updateUser);

module.exports = router;
