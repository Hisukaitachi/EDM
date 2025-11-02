const userModel = require('../models/userModel');
const bcrypt = require('bcryptjs');

const userService = {
  // Get all users
  getAllUsers: async () => {
    return await userModel.getAll();
  },

  // Get user by ID
  getUserById: async (userId) => {
    const user = await userModel.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  },

  // Create new user (Admin only)
  createUser: async (username, password, fullName, role) => {
    // Check if username exists
    const existing = await userModel.findByUsername(username);
    if (existing) {
      throw new Error('Username already exists');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const userId = await userModel.create(username, passwordHash, fullName, role);

    return { userId, username, fullName, role };
  },

  // Update user status (activate/deactivate)
  updateUserStatus: async (userId, status) => {
    if (!['active', 'inactive'].includes(status)) {
      throw new Error('Status must be active or inactive');
    }

    const result = await userModel.updateStatus(userId, status);
    if (result === 0) {
      throw new Error('User not found');
    }

    return { message: `User ${status === 'active' ? 'activated' : 'deactivated'} successfully` };
  },

  // Get staff list only
  getStaffList: async () => {
    const users = await userModel.getAll();
    return users.filter(u => u.role === 'staff');
  }
};

module.exports = userService;