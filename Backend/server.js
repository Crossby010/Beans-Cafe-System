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

// ============ MULTER SETUP ============
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only images allowed'), false);
        }
    }
});

// Test route (no auth needed)
app.get('/api/test', (req, res) => {
    res.json({ message: 'Beans Cafe API is running!' });
});

// Upload endpoint
app.post('/api/upload', authenticate, adminAuth, upload.single('image'), (req, res) => {
    console.log('Upload endpoint hit');
    
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    
    // Use dynamic URL for production
    const baseUrl = process.env.NODE_ENV === 'production' 
        ? `https://${req.get('host')}`
        : 'http://localhost:5000';
    const imageUrl = `${baseUrl}/uploads/${req.file.filename}`;
    
    console.log('File saved:', req.file.filename);
    console.log('URL:', imageUrl);
    
    res.json({ success: true, url: imageUrl });
});

// Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/recipes', recipeRoutes);

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