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

const router = express.Router();

// Public route (no auth needed for placing order)
router.post('/', createOrder);

// Public route to check order status by number
router.get('/track/:orderNumber', getOrderByNumber);

// Authenticated user routes
router.get('/my-orders', authenticate, getUserOrders);

// Admin/Staff routes
router.get('/', authenticate, adminAuth, getOrders);
router.get('/pending', authenticate, adminAuth, getPendingOrders);
router.put('/:id/status', authenticate, adminAuth, updateOrderStatus);
router.delete('/:id', authenticate, adminAuth, deleteOrder);

module.exports = router;