const userService = require('../services/userService');

const userController = {
  // GET /api/users
  getAll: async (req, res, next) => {
    try {
      const users = await userService.getAllUsers();

      res.json({
        success: true,
        count: users.length,
        data: users
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/users/:id
  getById: async (req, res, next) => {
    try {
      const user = await userService.getUserById(req.params.id);

      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/users (Admin creates new user)
  create: async (req, res, next) => {
    try {
      const { username, password, fullName, role } = req.body;

      if (!username || !password || !fullName) {
        return res.status(400).json({
          success: false,
          message: 'Username, password, and full name are required'
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters'
        });
      }

      const user = await userService.createUser(username, password, fullName, role || 'staff');

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: user
      });
    } catch (error) {
      next(error);
    }
  },

  // PUT /api/users/:id/status (Admin activate/deactivate user)
  updateStatus: async (req, res, next) => {
    try {
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          message: 'Status is required'
        });
      }

      const result = await userService.updateUserStatus(req.params.id, status);

      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/users/staff/list
  getStaffList: async (req, res, next) => {
    try {
      const staff = await userService.getStaffList();

      res.json({
        success: true,
        count: staff.length,
        data: staff
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = userController;