const pool = require('./config/database');

async function testDB() {
    try {
        const result = await pool.query('SELECT NOW() as current_time');
        console.log('Database connected! Current time:', result.rows[0].current_time);
        
        const products = await pool.query('SELECT * FROM products');
        console.log(`Found ${products.rows.length} products in menu`);
        
        process.exit(0);
    } catch (error) {
        console.error('Database error:', error.message);
        process.exit(1);
    }
}

testDB();