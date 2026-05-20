const Product = require('../models/Product');

// Get all products
const getProducts = async (req, res) => {
    try {
        const { category, featured, new: isNew, bestseller } = req.query;
        
        const filters = {
            category: category || 'all',
            isFeatured: featured === 'true',
            isNew: isNew === 'true',
            isBestSeller: bestseller === 'true'
        };
        
        const products = await Product.findAll(filters);
        res.json({ success: true, products });
    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get single product
const getProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        
        // Get customization options
        const customizations = await Product.getCustomizations(req.params.id);
        
        res.json({ 
            success: true, 
            product,
            customizations 
        });
    } catch (error) {
        console.error('Get product error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Create product (Admin only)
const createProduct = async (req, res) => {
    try {
        // Check if admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }
        
        const { name, description, price, category, image_url, stock_quantity, is_featured, is_new, is_best_seller } = req.body;
        
        console.log('Received product data:', { name, price, image_url, is_featured, is_new, is_best_seller });
        
        const newProduct = await Product.create({
            name,
            description,
            price,
            category,
            image_url: image_url,
            stock_quantity: stock_quantity,
            is_featured: is_featured || false,
            is_new: is_new || false,
            is_best_seller: is_best_seller || false
        });
        
        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            product: newProduct
        });
    } catch (error) {
        console.error('Create product error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update product (Admin only)
const updateProduct = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }
        
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        
        const { name, description, price, category, image_url, stock_quantity, is_available, is_featured, is_new, is_best_seller } = req.body;
        
        const updatedProduct = await Product.update(req.params.id, {
            name,
            description,
            price,
            category,
            image_url: image_url,
            stock_quantity: stock_quantity,
            is_available: is_available !== undefined ? is_available : true,
            is_featured: is_featured || false,
            is_new: is_new || false,
            is_best_seller: is_best_seller || false
        });
        
        res.json({
            success: true,
            message: 'Product updated successfully',
            product: updatedProduct
        });
    } catch (error) {
        console.error('Update product error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete product (Admin only)
const deleteProduct = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }
        
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        
        await Product.delete(req.params.id);
        
        res.json({
            success: true,
            message: 'Product deleted successfully'
        });
    } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct
};