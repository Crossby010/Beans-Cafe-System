const express = require('express');
const {
    getUsers,
    getUser,
    createUser,
    updateUser,
    deleteUser
} = require('../controllers/userController');
const authenticate = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

const router = express.Router();

// All user routes require admin access
router.get('/', authenticate, adminAuth, getUsers);
router.get('/:id', authenticate, adminAuth, getUser);
router.post('/', authenticate, adminAuth, createUser);
router.put('/:id', authenticate, adminAuth, updateUser);
router.delete('/:id', authenticate, adminAuth, deleteUser);

module.exports = router;