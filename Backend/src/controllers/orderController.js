const Order = require('../models/Order');
const pool = require('../config/database');

// Create new order
const createOrder = async (req, res) => {
    try {
        const { customerName, customerPhone, items, subtotal, total, orderType, source, pickupTime, notes } = req.body;
        
        console.log('📦 Received order:', req.body);
        
        if (!items || items.length === 0) {
            return res.status(400).json({ success: false, message: 'Order must have at least one item' });
        }
        
        if (!customerName || !customerPhone) {
            return res.status(400).json({ success: false, message: 'Customer name and phone are required' });
        }
        
        // Check for duplicate order within last 5 seconds
        const duplicateCheck = await pool.query(
            `SELECT * FROM orders 
             WHERE customer_phone = $1 
             AND created_at > NOW() - INTERVAL '5 seconds'
             AND status = 'pending'
             ORDER BY created_at DESC LIMIT 1`,
            [customerPhone]
        );
        
        if (duplicateCheck.rows.length > 0) {
            const lastOrder = duplicateCheck.rows[0];
            if (JSON.stringify(lastOrder.items) === JSON.stringify(items)) {
                console.log('⚠️ Duplicate order detected, returning existing order');
                return res.status(200).json({
                    success: true,
                    message: 'Order already placed',
                    order: lastOrder
                });
            }
        }
        
        // Generate unique order number
        const date = new Date();
        const dateStr = date.getFullYear().toString().slice(-2) + 
                       (date.getMonth() + 1).toString().padStart(2, '0') + 
                       date.getDate().toString().padStart(2, '0');
        const randomNum = Math.floor(Math.random() * 9000 + 1000);
        const orderNumber = `BNS${dateStr}${randomNum}`;
        
        console.log('📝 Generated order number:', orderNumber);
        
        const orderData = {
            order_number: orderNumber,
            user_id: req.user?.id || null,
            customer_name: customerName,
            customer_phone: customerPhone,
            items: items,
            subtotal: parseFloat(subtotal),
            total: parseFloat(total),
            order_type: orderType || 'pickup',
            source: source || 'website',
            status: 'pending',
            pickup_time: pickupTime || 'ASAP',
            notes: notes || ''
        };
        
        const newOrder = await Order.create(orderData);
        
        console.log('✅ Order saved to database:', newOrder);
        
        const io = req.app.get('io');
        if (io) {
            io.emit('new_order', {
                id: newOrder.id,
                order_number: orderNumber,
                customer_name: customerName,
                total: total,
                status: 'pending',
                created_at: newOrder.created_at
            });
            console.log('📡 Socket event emitted: new_order');
        }
        
        res.status(201).json({
            success: true,
            message: 'Order placed successfully',
            order: {
                id: newOrder.id,
                order_number: orderNumber,
                customer_name: customerName,
                customer_phone: customerPhone,
                total: total,
                status: 'pending',
                created_at: newOrder.created_at
            }
        });
        
    } catch (error) {
        console.error('❌ Create order error:', error);
        res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
};

// Get all orders
const getOrders = async (req, res) => {
    try {
        const { status } = req.query;
        const orders = await Order.findAll(status);
        res.json({ success: true, orders });
    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get pending orders (for POS)
const getPendingOrders = async (req, res) => {
    try {
        const orders = await Order.getPendingOrders();
        res.json({ success: true, orders });
    } catch (error) {
        console.error('Get pending orders error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get user orders
const getUserOrders = async (req, res) => {
    try {
        const orders = await Order.findByUserId(req.user.id);
        res.json({ success: true, orders });
    } catch (error) {
        console.error('Get user orders error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get order by number
const getOrderByNumber = async (req, res) => {
    try {
        const { orderNumber } = req.params;
        const order = await Order.findByOrderNumber(orderNumber);
        
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        
        res.json({ success: true, order });
    } catch (error) {
        console.error('Get order error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update order status
const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        const order = await Order.findById(parseInt(id));
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        
        const updatedOrder = await Order.updateStatus(order.id, status);
        
        const io = req.app.get('io');
        if (io) {
            io.emit('order_status_update', updatedOrder);
        }
        
        res.json({
            success: true,
            message: 'Order status updated',
            order: updatedOrder
        });
    } catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete order
const deleteOrder = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }
        
        const order = await Order.findById(parseInt(req.params.id));
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        
        await Order.delete(order.id);
        
        res.json({
            success: true,
            message: 'Order deleted successfully'
        });
    } catch (error) {
        console.error('Delete order error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    createOrder,
    getOrders,
    getPendingOrders,
    getUserOrders,
    getOrderByNumber,
    updateOrderStatus,
    deleteOrder
};