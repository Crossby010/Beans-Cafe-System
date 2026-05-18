const express = require('express');
const { getSettings, getPublicSettings, updateSettings } = require('../controllers/settingController');
const authenticate = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

const router = express.Router();

// Public route (no auth needed for website)
router.get('/public', getPublicSettings);

// Admin only routes
router.get('/', authenticate, adminAuth, getSettings);
router.put('/', authenticate, adminAuth, updateSettings);

module.exports = router;