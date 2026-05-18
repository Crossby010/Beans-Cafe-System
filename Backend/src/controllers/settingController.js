const pool = require('../config/database');

// Get all settings (Admin only)
const getSettings = async (req, res) => {
    try {
        const result = await pool.query('SELECT setting_key, setting_value FROM settings');
        const settings = {};
        result.rows.forEach(row => {
            settings[row.setting_key] = row.setting_value;
        });
        res.json({ success: true, settings });
    } catch (error) {
        console.error('Error getting settings:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Get public settings (no auth required for website)
const getPublicSettings = async (req, res) => {
    try {
        const result = await pool.query('SELECT setting_key, setting_value FROM settings');
        const settings = {};
        result.rows.forEach(row => {
            settings[row.setting_key] = row.setting_value;
        });
        res.json({ success: true, settings });
    } catch (error) {
        console.error('Error getting public settings:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Update settings (Admin only)
const updateSettings = async (req, res) => {
    try {
        const settings = req.body;
        
        for (const [key, value] of Object.entries(settings)) {
            await pool.query(
                `INSERT INTO settings (setting_key, setting_value, updated_at) 
                 VALUES ($1, $2, CURRENT_TIMESTAMP) 
                 ON CONFLICT (setting_key) 
                 DO UPDATE SET setting_value = $2, updated_at = CURRENT_TIMESTAMP`,
                [key, value]
            );
        }
        
        res.json({ success: true, message: 'Settings saved' });
    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = { getSettings, getPublicSettings, updateSettings };