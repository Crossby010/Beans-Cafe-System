const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'BeanCafe_db'
});

async function exportDatabase() {
    const tables = ['products', 'users', 'orders', 'inventory_items', 'recipes', 'settings'];
    const exportData = {};
    
    for (const table of tables) {
        const result = await pool.query(`SELECT * FROM ${table}`);
        exportData[table] = result.rows;
        console.log(`Exported ${table}: ${result.rows.length} rows`);
    }
    
    fs.writeFileSync('database_export.json', JSON.stringify(exportData, null, 2));
    console.log('Export complete! Saved to database_export.json');
    pool.end();
}

exportDatabase();