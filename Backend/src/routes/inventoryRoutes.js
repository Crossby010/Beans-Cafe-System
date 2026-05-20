const express = require('express');
const pool = require('../config/database');
const authenticate = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

const router = express.Router();

// Get all inventory items
router.get('/', authenticate, adminAuth, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM inventory_items ORDER BY name'
        );
        res.json({ success: true, items: result.rows });
    } catch (error) {
        console.error('Error getting inventory:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get single inventory item
router.get('/:id', authenticate, adminAuth, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM inventory_items WHERE id = $1',
            [req.params.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Item not found' });
        }
        res.json({ success: true, item: result.rows[0] });
    } catch (error) {
        console.error('Error getting inventory item:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Add new inventory item
router.post('/', authenticate, adminAuth, async (req, res) => {
    try {
        const { name, unit, stock_quantity, min_stock_level, cost_per_unit, supplier, category } = req.body;
        
        console.log('Received inventory item:', { name, unit, stock_quantity, min_stock_level, cost_per_unit, supplier, category });
        
        // Ensure numeric values are numbers
        const stockQty = parseFloat(stock_quantity) || 0;
        const minStock = parseFloat(min_stock_level) || 0;
        const costPerUnit = parseFloat(cost_per_unit) || 0;
        
        const result = await pool.query(
            `INSERT INTO inventory_items (name, unit, stock_quantity, min_stock_level, cost_per_unit, supplier, category) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) 
             RETURNING *`,
            [name, unit, stockQty, minStock, costPerUnit, supplier || null, category || null]
        );
        
        // Add transaction log for initial stock
        if (stockQty > 0) {
            await pool.query(
                `INSERT INTO stock_transactions (inventory_item_id, transaction_type, quantity, note) 
                 VALUES ($1, 'add', $2, $3)`,
                [result.rows[0].id, stockQty, 'Initial stock']
            );
        }
        
        res.json({ success: true, item: result.rows[0] });
    } catch (error) {
        console.error('Error adding inventory item:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Add stock to inventory item
router.post('/:id/add-stock', authenticate, adminAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { quantity, cost, note } = req.body;
        
        // Update stock quantity
        const result = await pool.query(
            `UPDATE inventory_items 
             SET stock_quantity = stock_quantity + $1, updated_at = CURRENT_TIMESTAMP 
             WHERE id = $2 
             RETURNING *`,
            [quantity, id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Item not found' });
        }
        
        // Add transaction log
        await pool.query(
            `INSERT INTO stock_transactions (inventory_item_id, transaction_type, quantity, note) 
             VALUES ($1, 'add', $2, $3)`,
            [id, quantity, note || 'Stock added']
        );
        
        res.json({ success: true, item: result.rows[0] });
    } catch (error) {
        console.error('Error adding stock:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Remove stock (for manual adjustments)
router.post('/:id/remove-stock', authenticate, adminAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { quantity, note } = req.body;
        
        const result = await pool.query(
            `UPDATE inventory_items 
             SET stock_quantity = stock_quantity - $1, updated_at = CURRENT_TIMESTAMP 
             WHERE id = $2 
             RETURNING *`,
            [quantity, id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Item not found' });
        }
        
        await pool.query(
            `INSERT INTO stock_transactions (inventory_item_id, transaction_type, quantity, note) 
             VALUES ($1, 'remove', $2, $3)`,
            [id, quantity, note || 'Manual removal']
        );
        
        res.json({ success: true, item: result.rows[0] });
    } catch (error) {
        console.error('Error removing stock:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Delete inventory item
router.delete('/:id', authenticate, adminAuth, async (req, res) => {
    try {
        const result = await pool.query(
            'DELETE FROM inventory_items WHERE id = $1 RETURNING id',
            [req.params.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Item not found' });
        }
        
        res.json({ success: true, message: 'Item deleted' });
    } catch (error) {
        console.error('Error deleting inventory item:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get stock transactions
router.get('/transactions/all', authenticate, adminAuth, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT t.*, i.name as item_name 
             FROM stock_transactions t
             JOIN inventory_items i ON t.inventory_item_id = i.id
             ORDER BY t.created_at DESC
             LIMIT 100`
        );
        res.json({ success: true, transactions: result.rows });
    } catch (error) {
        console.error('Error getting transactions:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get low stock items
router.get('/low-stock/alerts', authenticate, adminAuth, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM inventory_items 
             WHERE stock_quantity <= min_stock_level 
             ORDER BY (stock_quantity / NULLIF(min_stock_level, 0)) ASC`
        );
        res.json({ success: true, items: result.rows });
    } catch (error) {
        console.error('Error getting low stock:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;