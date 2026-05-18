const pool = require('../config/database');

class Order {
    // Create new order
    static async create(orderData) {
        const { 
            order_number, user_id, customer_name, customer_phone, 
            items, subtotal, total, order_type, source, 
            status, pickup_time, notes 
        } = orderData;
        
        const query = `
            INSERT INTO orders (
                order_number, user_id, customer_name, customer_phone, 
                items, subtotal, total, order_type, source, 
                status, pickup_time, notes, created_at
            ) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP) 
            RETURNING *
        `;
        
        const values = [
            order_number, user_id, customer_name, customer_phone,
            JSON.stringify(items), subtotal, total, order_type, source,
            status || 'pending', pickup_time || null, notes || null
        ];
        
        const result = await pool.query(query, values);
        return result.rows[0];
    }

    // Get all orders
    static async findAll(status = null) {
        let query = 'SELECT * FROM orders ORDER BY created_at DESC';
        const values = [];
        
        if (status) {
            query = 'SELECT * FROM orders WHERE status = $1 ORDER BY created_at DESC';
            values.push(status);
        }
        
        const result = await pool.query(query, values);
        return result.rows;
    }

    // Get pending orders (for POS display)
    static async getPendingOrders() {
        const result = await pool.query(
            `SELECT * FROM orders 
             WHERE status IN ('pending', 'preparing') 
             ORDER BY created_at ASC`
        );
        return result.rows;
    }

    // Get orders by user ID
    static async findByUserId(userId) {
        const result = await pool.query(
            'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
            [userId]
        );
        return result.rows;
    }

    // Get order by order number
    static async findByOrderNumber(orderNumber) {
        const result = await pool.query(
            'SELECT * FROM orders WHERE order_number = $1',
            [orderNumber]
        );
        return result.rows[0];
    }

    // Get order by ID
    static async findById(id) {
        const result = await pool.query(
            'SELECT * FROM orders WHERE id = $1',
            [id]
        );
        return result.rows[0];
    }

    // Update order status
    static async updateStatus(orderId, status) {
        let ready_at = null;
        if (status === 'ready') {
            ready_at = new Date();
        }
        
        const result = await pool.query(
            `UPDATE orders 
             SET status = $1, updated_at = CURRENT_TIMESTAMP, ready_at = $2
             WHERE id = $3 
             RETURNING *`,
            [status, ready_at, orderId]
        );
        
        return result.rows[0];
    }

    // Delete order
    static async delete(orderId) {
        await pool.query('DELETE FROM orders WHERE id = $1', [orderId]);
        return true;
    }
}

module.exports = Order;