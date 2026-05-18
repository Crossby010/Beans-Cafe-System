const express = require('express');
const pool = require('../config/database');
const authenticate = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

const router = express.Router();

// Get all recipes
router.get('/', authenticate, adminAuth, async (req, res) => {
    try {
        const recipes = await pool.query(
            `SELECT r.*, 
                    COALESCE(
                        json_agg(
                            json_build_object(
                                'ingredient_id', ri.inventory_item_id,
                                'ingredient_name', i.name,
                                'quantity', ri.quantity,
                                'unit', ri.unit,
                                'cost_per_unit', i.cost_per_unit
                            )
                        ) FILTER (WHERE ri.id IS NOT NULL), '[]'
                    ) as ingredients
             FROM recipes r
             LEFT JOIN recipe_ingredients ri ON r.id = ri.recipe_id
             LEFT JOIN inventory_items i ON ri.inventory_item_id = i.id
             GROUP BY r.id
             ORDER BY r.name`
        );
        
        res.json({ success: true, recipes: recipes.rows });
    } catch (error) {
        console.error('Error getting recipes:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get single recipe
router.get('/:id', authenticate, adminAuth, async (req, res) => {
    try {
        const recipe = await pool.query(
            `SELECT r.*, 
                    COALESCE(
                        json_agg(
                            json_build_object(
                                'ingredient_id', ri.inventory_item_id,
                                'ingredient_name', i.name,
                                'quantity', ri.quantity,
                                'unit', ri.unit,
                                'cost_per_unit', i.cost_per_unit
                            )
                        ) FILTER (WHERE ri.id IS NOT NULL), '[]'
                    ) as ingredients
             FROM recipes r
             LEFT JOIN recipe_ingredients ri ON r.id = ri.recipe_id
             LEFT JOIN inventory_items i ON ri.inventory_item_id = i.id
             WHERE r.id = $1
             GROUP BY r.id`,
            [req.params.id]
        );
        
        if (recipe.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Recipe not found' });
        }
        
        res.json({ success: true, recipe: recipe.rows[0] });
    } catch (error) {
        console.error('Error getting recipe:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Add new recipe
router.post('/', authenticate, adminAuth, async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        const { product_id, name, instructions, prep_time, ingredients } = req.body;
        
        // Insert recipe
        const recipeResult = await client.query(
            `INSERT INTO recipes (product_id, name, instructions, prep_time) 
             VALUES ($1, $2, $3, $4) 
             RETURNING id`,
            [product_id, name, instructions, prep_time || 5]
        );
        
        const recipeId = recipeResult.rows[0].id;
        
        // Insert recipe ingredients
        for (const ing of ingredients) {
            // Get the unit from inventory item
            const unitResult = await client.query(
                'SELECT unit FROM inventory_items WHERE id = $1',
                [ing.inventory_item_id]
            );
            const unit = unitResult.rows[0]?.unit || 'unit';
            
            await client.query(
                `INSERT INTO recipe_ingredients (recipe_id, inventory_item_id, quantity, unit) 
                 VALUES ($1, $2, $3, $4)`,
                [recipeId, ing.inventory_item_id, ing.quantity, unit]
            );
        }
        
        await client.query('COMMIT');
        
        res.json({ success: true, message: 'Recipe added', recipe_id: recipeId });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error adding recipe:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    } finally {
        client.release();
    }
});

// Delete recipe
router.delete('/:id', authenticate, adminAuth, async (req, res) => {
    try {
        await pool.query('DELETE FROM recipe_ingredients WHERE recipe_id = $1', [req.params.id]);
        await pool.query('DELETE FROM recipes WHERE id = $1', [req.params.id]);
        
        res.json({ success: true, message: 'Recipe deleted' });
    } catch (error) {
        console.error('Error deleting recipe:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;