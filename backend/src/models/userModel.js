const db = require('../config/database');

const userModel = {
    //Find user by username
    findByUsername: async (username) => {
        const [rows] = await db.execute
        ('SELECT * FROM users WHERE username = ?', [username]);
        return rows[0];
    },

    //Find user by ID
    findById: async (userId) => {
        const [rows] = await db.execute
        ('SELECT user_id, username, full_name, role, status, created_at FROM users WHERE user_id = ?', [userId]);
        return rows[0];
    },

    //Create new user
    create: async (username, passwordHash, fullName, role = 'staff') => {
        const [result] = await db.query(
            'INSERT INTO users (username, password_hash, full_name, role) VALUES (?, ?, ?, ?)',
            [username, passwordHash, fullName, role]
        );
        return result.insertId;
    },

    //Get all users
    getAll: async () => {
        const [rows] = await db.query(
            'SELECT user_id, username, full_name, role, status, created_at FROM users ORDER BY created_at DESC'
        );
        return rows;
    },

    //Update user status
    updateStatus: async (userId, status) => {
        const [result] = await db.query(
            'UPDATE users SET status = ? WHERE user_id = ?',
            [status, userId]
        );
        return result.affectedRows;
    }
};

module.exports = userModel;

