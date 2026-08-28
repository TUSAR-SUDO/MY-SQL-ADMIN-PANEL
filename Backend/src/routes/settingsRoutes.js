const express = require('express');
const { getSettings, updateSettings } = require('../controllers/settingsController');
const { protect, requireSuperAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(protect, requireSuperAdmin);

router.get('/', getSettings);
router.put('/', updateSettings);

module.exports = router;
