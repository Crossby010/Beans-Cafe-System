const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        console.log('Auth header:', authHeader);
        
        const token = authHeader?.replace('Bearer ', '');
        
        if (!token) {
            console.log('No token provided');
            return res.status(401).json({ success: false, message: 'No token provided' });
        }
        
        const secret = process.env.JWT_SECRET || 'beans_cafe_secret_key_2024';
        const decoded = jwt.verify(token, secret);
        console.log('Token decoded:', decoded);
        
        const user = await User.findById(decoded.id);
        
        if (!user) {
            console.log('User not found for id:', decoded.id);
            return res.status(401).json({ success: false, message: 'User not found' });
        }
        
        req.user = {
            id: user.id,
            email: user.email,
            role: user.role
        };
        
        console.log('Authenticated user:', req.user);
        next();
    } catch (error) {
        console.error('Auth error:', error.message);
        res.status(401).json({ success: false, message: 'Invalid token: ' + error.message });
    }
};

module.exports = authenticate;