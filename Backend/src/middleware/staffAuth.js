// Staff authentication - allows both admin and staff
const staffAuth = (req, res, next) => {
    console.log('Checking staff access. User role:', req.user?.role);
    
    if (!req.user) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    
    if (req.user.role === 'admin' || req.user.role === 'staff') {
        next();
    } else {
        console.log('Access denied. User role:', req.user.role);
        res.status(403).json({ success: false, message: 'Staff access required' });
    }
};

module.exports = staffAuth;