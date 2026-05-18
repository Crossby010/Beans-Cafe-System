const express = require('express');
const { getSettings, updateSettings } = require('../controllers/settingController');
const authenticate = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

const router = express.Router();

router.get('/', authenticate, adminAuth, getSettings);
router.put('/', authenticate, adminAuth, updateSettings);

module.exports = router;