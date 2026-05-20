const express = require('express');
const {
    createOrder,
    getOrders,
    getPendingOrders,
    getUserOrders,
    getOrderByNumber,
    updateOrderStatus,
    deleteOrder
} = require('../controllers/orderController');
const authenticate = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const staffAuth = require('../middleware/staffAuth');  // ← ADD THIS

const router = express.Router();

// Public route (no auth needed for placing order)
router.post('/', createOrder);

// Public route to check order status by number
router.get('/track/:orderNumber', getOrderByNumber);

// Authenticated user routes
router.get('/my-orders', authenticate, getUserOrders);

// Staff routes (Admin + Staff can access)
router.get('/', authenticate, staffAuth, getOrders);  // ← CHANGED from adminAuth to staffAuth
router.get('/pending', authenticate, staffAuth, getPendingOrders);  // ← CHANGED
router.put('/:id/status', authenticate, staffAuth, updateOrderStatus);  // ← CHANGED

// Admin only routes
router.delete('/:id', authenticate, adminAuth, deleteOrder);  // ← KEPT as adminAuth

module.exports = router;