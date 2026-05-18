const express = require('express');
const {
    getProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct
} = require('../controllers/productController');
const authenticate = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

const router = express.Router();

// Public routes
router.get('/', getProducts);
router.get('/:id', getProduct);

// Admin only routes
router.post('/', authenticate, adminAuth, createProduct);
router.put('/:id', authenticate, adminAuth, updateProduct);
router.delete('/:id', authenticate, adminAuth, deleteProduct);

module.exports = router;