const authService = require('../services/authService');

const authController = {
    // POST /api/auth/register
    register: async (req, res, next) => {
        try {
            const { username, password, fullName, role } = req.body;

            // Validation
            if (!username || !password || !fullName) {
                return res.status(400).json({
                    success: false,
                    message: 'Username, password, and full name are required.'
                });
            }

            if (password.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: 'Password must be at least 6 characters long.'
                });
            }

            const user = await authService.register(username, password, fullName, role);
            res.status(201).json({
                success: true,
                message: 'User registered successfully.',
                data: user
            });
        }
        catch (error) {
            next(error);
        }
    },

    // POST /api/auth/login
    login: async (req, res, next) => {
        try {
            const { username, password } = req.body;

            // Validation
            if (!username || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Username and password are required.'
                });
            }

            const result = await authService.login(username, password);

            res.status(200).json({
                success: true,
                message: 'Login successful.',
                data: result
            });
        }
        catch (error) {
            res.status(401).json({
                success: false,
                message: error.message
            });
        }
    },

    // GET /api/auth/me
    getMe: async (req, res, next) => {
        try {
            res.status(200).json({
                success: true,
                data: req.user
            });
        }
        catch (error) {
            next(error);
        }
    }
};

module.exports = authController;
