const pool = require('../config/database');
const bcrypt = require('bcrypt');

// Get all users
const getUsers = async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, email, first_name, last_name, role, created_at FROM users ORDER BY created_at DESC'
        );
        res.json({ success: true, users: result.rows });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Get single user
const getUser = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'SELECT id, email, first_name, last_name, role, created_at FROM users WHERE id = $1',
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        res.json({ success: true, user: result.rows[0] });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Create user (admin/staff)
const createUser = async (req, res) => {
    try {
        const { first_name, last_name, email, password, role } = req.body;
        
        // Check if user exists
        const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existing.rows.length > 0) {
            return res.status(400).json({ success: false, message: 'Email already exists' });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const result = await pool.query(
            `INSERT INTO users (email, password_hash, first_name, last_name, role) 
             VALUES ($1, $2, $3, $4, $5) 
             RETURNING id, email, first_name, last_name, role`,
            [email, hashedPassword, first_name, last_name, role || 'staff']
        );
        
        res.status(201).json({ success: true, user: result.rows[0] });
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Update user
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { first_name, last_name, email, role, password } = req.body;
        
        let query = '';
        let params = [];
        
        if (password && password.trim() !== '') {
            const hashedPassword = await bcrypt.hash(password, 10);
            query = `UPDATE users SET first_name = $1, last_name = $2, email = $3, role = $4, password_hash = $5 WHERE id = $6 RETURNING id, email, first_name, last_name, role`;
            params = [first_name, last_name, email, role, hashedPassword, id];
        } else {
            query = `UPDATE users SET first_name = $1, last_name = $2, email = $3, role = $4 WHERE id = $5 RETURNING id, email, first_name, last_name, role`;
            params = [first_name, last_name, email, role, id];
        }
        
        const result = await pool.query(query, params);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        res.json({ success: true, user: result.rows[0] });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Delete user
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Don't allow deleting the main admin
        const checkAdmin = await pool.query('SELECT email FROM users WHERE id = $1', [id]);
        if (checkAdmin.rows[0]?.email === 'admin@beanscafe.com') {
            return res.status(400).json({ success: false, message: 'Cannot delete main admin account' });
        }
        
        const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        res.json({ success: true, message: 'User deleted' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = {
    getUsers,
    getUser,
    createUser,
    updateUser,
    deleteUser
};