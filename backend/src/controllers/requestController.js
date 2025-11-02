const requestService = require('../services/requestService');

const requestController = {
  // GET /api/requests
  getAll: async (req, res, next) => {
    try {
      const filters = {
        status: req.query.status,
        userId: req.query.userId
      };

      const requests = await requestService.getAllRequests(
        filters,
        req.user.role,
        req.user.userId
      );

      res.json({
        success: true,
        count: requests.length,
        data: requests
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/requests/:id
  getById: async (req, res, next) => {
    try {
      const request = await requestService.getRequestById(
        req.params.id,
        req.user.role,
        req.user.userId
      );

      res.json({
        success: true,
        data: request
      });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/requests (Staff creates request)
  create: async (req, res, next) => {
    try {
      const { inventoryId, quantity, reason } = req.body;

      if (!inventoryId || !quantity) {
        return res.status(400).json({
          success: false,
          message: 'Inventory ID and quantity are required'
        });
      }

      const result = await requestService.createRequest(
        inventoryId,
        req.user.userId,
        quantity,
        reason || ''
      );

      res.status(201).json({
        success: true,
        message: 'Stock request created successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  },

  // PUT /api/requests/:id/process (Admin approves/rejects)
  process: async (req, res, next) => {
  try {
    // Debug log
    console.log('Request body:', req.body);
    console.log('Request params:', req.params);
    console.log('Request user:', req.user);

    // Check if body exists
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Request body is empty. Make sure Content-Type is application/json'
      });
    }

    const { status, notes } = req.body;

    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Valid status (approved/rejected) is required',
        received: { status, notes }
      });
    }

    const result = await requestService.processRequest(
      req.params.id,
      req.user.userId,
      status,
      notes || ''
    );

    res.json({
      success: true,
      message: `Request ${status} successfully`,
      data: result
    });
  } catch (error) {
    next(error);
  }
},

  // GET /api/requests/stats/pending
  getPendingCount: async (req, res, next) => {
    try {
      const count = await requestService.getPendingCount();

      res.json({
        success: true,
        data: { pendingCount: count }
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/requests/my-requests
  getMyRequests: async (req, res, next) => {
    try {
      const requests = await requestService.getUserRequestHistory(req.user.userId);

      res.json({
        success: true,
        count: requests.length,
        data: requests
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = requestController;