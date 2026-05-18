const pool = require('../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const login = async (req, res) => {
    const { email, password } = req.body;
    
    console.log('Login request for:', email);
    
    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password required' });
    }
    
    try {
        // Find user
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];
        
        if (!user) {
            console.log('User not found:', email);
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        
        console.log('User found, role:', user.role);
        
        // Compare password
        const validPassword = await bcrypt.compare(password, user.password_hash);
        
        if (!validPassword) {
            console.log('Invalid password for:', email);
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        
        // Generate token
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'beans_cafe_secret_key_2024',
            { expiresIn: '7d' }
        );
        
        console.log('Login successful for:', email);
        
        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                role: user.role
            }
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const register = async (req, res) => {
    const { email, password, firstName, lastName } = req.body;
    
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const result = await pool.query(
            `INSERT INTO users (email, password_hash, first_name, last_name, role) 
             VALUES ($1, $2, $3, $4, 'customer') 
             RETURNING id, email, first_name, last_name, role`,
            [email, hashedPassword, firstName, lastName]
        );
        
        const user = result.rows[0];
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'beans_cafe_secret_key_2024',
            { expiresIn: '7d' }
        );
        
        res.status(201).json({ success: true, token, user });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ success: false, message: 'Email already exists or server error' });
    }
};

const getMe = async (req, res) => {
    try {
        const result = await pool.query('SELECT id, email, first_name, last_name, role FROM users WHERE id = $1', [req.user.id]);
        res.json({ success: true, user: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = { login, register, getMe };