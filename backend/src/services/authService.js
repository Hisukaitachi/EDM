const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');

const authService = {
    // Register new user
    register: async (username, password, fullName, role = 'staff') => {
        // Check if user already exists
        const existingUser = await userModel.findByUsername(username);
        if (existingUser) {
            throw new Error('Username already taken.');
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Create user
        const userId = await userModel.create(username, passwordHash, fullName, role);
        return userId;
    },

    // Login user
    login: async (username, password) => {
        // Find user by username
        const user = await userModel.findByUsername(username);
        if (!user) {
            throw new Error('Invalid username or password.');
        }

        // Check if user is active
        if (user.status !== 'active') {
            throw new Error('User account is not active.');
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            throw new Error('Invalid username or password.');
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                userId: user.user_id,
                username: user.username,
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
        return {
            token,
            user: {
                userId: user.user_id,
                username: user.username,
                fullName: user.full_name,
                role: user.role
            }
        };
    },

    // Verify JWT token (testing/debugging purpose)
    verifyToken: (token) => {
        try {
            return jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            throw new Error('Invalid or expired token.');
        }
    }
};

module.exports = authService;