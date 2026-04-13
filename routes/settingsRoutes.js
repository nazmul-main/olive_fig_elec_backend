const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');

router.get('/', protect, settingsController.getSettings);
router.put('/', protect, authorize('admin'), settingsController.updateSettings);

module.exports = router;
