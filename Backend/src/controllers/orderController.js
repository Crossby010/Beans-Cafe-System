const Order = require('../models/Order');
const pool = require('../config/database');

// Deduct inventory when order is placed (DEFINE THIS FIRST)
async function deductInventory(orderItems) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        for (const item of orderItems) {
            // Get recipe for this product
            const recipeResult = await client.query(
                `SELECT ri.*, i.unit 
                 FROM recipe_ingredients ri
                 JOIN inventory_items i ON ri.inventory_item_id = i.id
                 WHERE ri.recipe_id = (SELECT id FROM recipes WHERE product_id = $1)`,
                [item.id]
            );
            
            const ingredients = recipeResult.rows;
            
            if (ingredients.length === 0) {
                console.log(`⚠️ No recipe found for product ${item.id}, skipping inventory deduction`);
                continue;
            }
            
            for (const ing of ingredients) {
                const quantityToDeduct = ing.quantity * item.quantity;
                
                // Update stock
                await client.query(
                    `UPDATE inventory_items 
                     SET stock_quantity = stock_quantity - $1, updated_at = CURRENT_TIMESTAMP
                     WHERE id = $2`,
                    [quantityToDeduct, ing.inventory_item_id]
                );
                
                // Create transaction record
                await client.query(
                    `INSERT INTO stock_transactions (inventory_item_id, transaction_type, quantity, note) 
                     VALUES ($1, 'remove', $2, $3)`,
                    [ing.inventory_item_id, quantityToDeduct, `Order placed - ${item.name}`]
                );
                
                console.log(`📉 Deducted ${quantityToDeduct} ${ing.unit} of ${ing.inventory_item_id} for order`);
            }
        }
        
        await client.query('COMMIT');
        return true;
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error deducting inventory:', error);
        throw error;
    } finally {
        client.release();
    }
}

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
        
        // ============ DEDUCT INVENTORY AFTER ORDER IS SAVED ============
        try {
            await deductInventory(items);
            console.log('✅ Inventory deducted for order');
        } catch (error) {
            console.error('❌ Failed to deduct inventory:', error);
            // Don't block the order - just log the error
        }
        
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