const pool = require('../config/database');

class Product {
    // Get all products
    static async findAll(filters = {}) {
        let query = 'SELECT * FROM products WHERE is_available = true';
        const values = [];
        let paramCount = 1;
        
        if (filters.category && filters.category !== 'all') {
            query += ` AND category = $${paramCount}`;
            values.push(filters.category);
            paramCount++;
        }
        
        if (filters.isFeatured) {
            query += ` AND is_featured = true`;
        }
        
        if (filters.isNew) {
            query += ` AND is_new = true`;
        }
        
        if (filters.isBestSeller) {
            query += ` AND is_best_seller = true`;
        }
        
        query += ' ORDER BY created_at DESC';
        
        const result = await pool.query(query, values);
        return result.rows;
    }

    // Get product by ID
    static async findById(id) {
        const result = await pool.query(
            'SELECT * FROM products WHERE id = $1',
            [id]
        );
        return result.rows[0];
    }

    // Create new product (Admin only)
    static async create(productData) {
        const { name, description, price, category, image_url, stock_quantity, is_featured, is_new, is_best_seller } = productData;
        
        const result = await pool.query(
            `INSERT INTO products (name, description, price, category, image_url, stock_quantity, is_featured, is_new, is_best_seller, is_available) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
             RETURNING *`,
            [name, description, price, category, image_url, stock_quantity, is_featured || false, is_new || false, is_best_seller || false, true]
        );
        
        return result.rows[0];
    }

    // Update product (Admin only)
    static async update(id, productData) {
        const { name, description, price, category, image_url, stock_quantity, is_available, is_featured, is_new, is_best_seller } = productData;
        
        // Set default values if undefined
        const finalIsAvailable = is_available !== undefined ? is_available : true;
        const finalIsFeatured = is_featured !== undefined ? is_featured : false;
        const finalIsNew = is_new !== undefined ? is_new : false;
        const finalIsBestSeller = is_best_seller !== undefined ? is_best_seller : false;
        
        const result = await pool.query(
            `UPDATE products 
             SET name = $1, description = $2, price = $3, category = $4, 
                 image_url = $5, stock_quantity = $6, is_available = $7, 
                 is_featured = $8, is_new = $9, is_best_seller = $10, updated_at = CURRENT_TIMESTAMP
             WHERE id = $11 
             RETURNING *`,
            [name, description, price, category, image_url, stock_quantity, finalIsAvailable, finalIsFeatured, finalIsNew, finalIsBestSeller, id]
        );
        
        return result.rows[0];
    }

    // Delete product (Admin only)
    static async delete(id) {
        await pool.query('DELETE FROM products WHERE id = $1', [id]);
        return true;
    }

    // Get customization options for a product
    static async getCustomizations(productId) {
        const result = await pool.query(
            'SELECT * FROM customization_options WHERE product_id = $1 ORDER BY display_order',
            [productId]
        );
        return result.rows;
    }
}

module.exports = Product;