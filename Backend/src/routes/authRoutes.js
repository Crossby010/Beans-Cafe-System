const express = require('express');
const { register, login, getMe } = require('../controllers/authController');
const authenticate = require('../middleware/auth');

const router = express.Router();

// These should have NO middleware - they are public
router.post('/register', register);
router.post('/login', login);

// This one needs authentication
router.get('/me', authenticate, getMe);

module.exports = router;