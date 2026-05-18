const pool = require('../config/database');
const bcrypt = require('bcrypt');

class User {
    static async findByEmail(email) {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        return result.rows[0];
    }

    static async findById(id) {
        const result = await pool.query('SELECT id, email, first_name, last_name, role FROM users WHERE id = $1', [id]);
        return result.rows[0];
    }

    static async create(userData) {
        const { email, password, first_name, last_name, role } = userData;
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const result = await pool.query(
            `INSERT INTO users (email, password_hash, first_name, last_name, role) 
             VALUES ($1, $2, $3, $4, $5) 
             RETURNING id, email, first_name, last_name, role`,
            [email, hashedPassword, first_name, last_name, role || 'customer']
        );
        
        return result.rows[0];
    }

    static async updateLastLogin(email) {
        await pool.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE email = $1', [email]);
    }

    static async comparePassword(plainPassword, hashedPassword) {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }
}

module.exports = User;