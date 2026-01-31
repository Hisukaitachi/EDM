// backend/src/services/requestService.js
const requestModel = require('../models/requestModel');
const inventoryModel = require('../models/inventoryModel');

const requestService = {
  // Get all requests (with filters)
  getAllRequests: async (filters = {}, userRole, userId) => {
    // If staff, only show their requests
    const filterUserId = userRole === 'staff' ? userId : filters.userId;
    
    return await requestModel.getAll(filters.status, filterUserId);
  },

  // Get single request
  getRequestById: async (requestId, userRole, userId) => {
    const request = await requestModel.getById(requestId);
    
    if (!request) {
      throw new Error('Request not found');
    }

    // Staff can only view their own requests
    if (userRole === 'staff' && request.requested_by !== userId) {
      throw new Error('Access denied');
    }

    return request;
  },

  // Create new request (Staff)
  createRequest: async (inventoryId, staffId, quantity, reason) => {
    // Verify inventory item exists
    const item = await inventoryModel.getById(inventoryId);
    if (!item) {
      throw new Error('Inventory item not found');
    }

    // Validate quantity
    if (quantity <= 0) {
      throw new Error('Quantity must be greater than 0');
    }

    // Check if enough stock available
    if (item.quantity_in_stock < quantity) {
      throw new Error(`Insufficient stock. Available: ${item.quantity_in_stock}`);
    }

    return await requestModel.create(inventoryId, staffId, quantity, reason);
  },

  // Approve or reject request (Admin)
  processRequest: async (requestId, adminId, status, notes) => {
    // Verify request exists
    const request = await requestModel.getById(requestId);
    if (!request) {
      throw new Error('Request not found');
    }

    // Check if already processed
    if (request.request_status !== 'pending') {
      throw new Error(`Request already ${request.request_status}`);
    }

    // Validate status
    if (!['approved', 'rejected'].includes(status)) {
      throw new Error('Status must be either approved or rejected');
    }

    return await requestModel.process(requestId, adminId, status, notes);
  },

  // Get pending count
  getPendingCount: async () => {
    return await requestModel.getPendingCount();
  },

  // Get user's request history
  getUserRequestHistory: async (userId) => {
    return await requestModel.getUserRequests(userId);
  }
};

module.exports = requestService;