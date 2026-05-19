const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

dotenv.config();

// Import routes
const authRoutes = require('./src/routes/authRoutes');
const productRoutes = require('./src/routes/productRoutes');
const orderRoutes = require('./src/routes/orderRoutes');
const userRoutes = require('./src/routes/userRoutes');
const settingRoutes = require('./src/routes/settingRoutes');
const inventoryRoutes = require('./src/routes/inventoryRoutes');
const recipeRoutes = require('./src/routes/recipeRoutes');

// Import middleware
const authenticate = require('./src/middleware/auth');
const adminAuth = require('./src/middleware/adminAuth');

// ============ Cloudinary SETUP ============
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure multer storage for Cloudinary
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'beans-cafe',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
        transformation: [{ width: 500, height: 500, crop: 'limit' }]
    }
});

const upload = multer({ storage: storage });

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    }
});

// CORS middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Make io accessible to routes
app.set('io', io);

// Test route
app.get('/api/test', (req, res) => {
    res.json({ message: 'Beans Cafe API is running!' });
});

// Upload endpoint with Cloudinary
app.post('/api/upload', authenticate, adminAuth, upload.single('image'), (req, res) => {
    console.log('Upload endpoint hit');
    
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    
    // Cloudinary returns the file path
    const imageUrl = req.file.path;
    console.log('Uploaded to Cloudinary:', imageUrl);
    
    res.json({ success: true, url: imageUrl });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/recipes', recipeRoutes);

// Debug database endpoint
app.get('/api/db-test', async (req, res) => {
    const pool = require('./src/config/database');
    try {
        const result = await pool.query('SELECT NOW() as time');
        res.json({ success: true, db: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Socket.io connection
io.on('connection', (socket) => {
    console.log('🟢 Client connected:', socket.id);
    
    socket.on('disconnect', () => {
        console.log('🔴 Client disconnected:', socket.id);
    });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 http://localhost:${PORT}`);
});