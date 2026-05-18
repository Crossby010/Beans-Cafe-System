const adminAuth = (req, res, next) => {
    console.log('Checking admin role. User role:', req.user?.role);
    
    if (!req.user) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    
    if (req.user.role === 'admin') {
        next();
    } else {
        console.log('Access denied. User role:', req.user.role);
        res.status(403).json({ success: false, message: 'Admin access required' });
    }
};

module.exports = adminAuth;