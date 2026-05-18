const pool = require('../config/database');

// Get all settings
const getSettings = async (req, res) => {
    try {
        const result = await pool.query('SELECT setting_key, setting_value FROM settings');
        const settings = {};
        result.rows.forEach(row => {
            settings[row.setting_key] = row.setting_value;
        });
        res.json({ success: true, settings });
    } catch (error) {
        console.error('Get settings error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Update settings
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
        console.error('Update settings error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = { getSettings, updateSettings };