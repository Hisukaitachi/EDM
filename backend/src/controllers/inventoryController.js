const inventoryService = require('../services/inventoryService');

const inventoryController = {
  // GET /api/inventory
  getAll: async (req, res, next) => {
    try {
      const filters = {
        status: req.query.status,
        categoryId: req.query.categoryId
      };

      const items = await inventoryService.getAllInventory(filters);

      res.json({
        success: true,
        count: items.length,
        data: items
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/inventory/:id
  getById: async (req, res, next) => {
    try {
      const item = await inventoryService.getInventoryById(req.params.id);

      res.json({
        success: true,
        data: item
      });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/inventory (Admin only)
  create: async (req, res, next) => {
    try {
      const productData = {
        productName: req.body.productName,
        productCode: req.body.productCode,
        categoryId: req.body.categoryId || null,
        description: req.body.description || null,
        unitPrice: req.body.unitPrice,
        quantity: req.body.quantity || 0,
        reorderLevel: req.body.reorderLevel || 10,
        unitOfMeasure: req.body.unitOfMeasure || 'pcs'
      };

      const result = await inventoryService.addProduct(productData, req.user.userId);

      res.status(201).json({
        success: true,
        message: 'Product added successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  },

  // PUT /api/inventory/:id (Admin only)
  update: async (req, res, next) => {
    try {
      const productData = {
        productName: req.body.productName,
        categoryId: req.body.categoryId,
        description: req.body.description,
        unitPrice: req.body.unitPrice,
        reorderLevel: req.body.reorderLevel,
        unitOfMeasure: req.body.unitOfMeasure
      };

      const result = await inventoryService.updateProduct(req.params.id, productData);

      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/inventory/:id/stock (Admin only - adjust stock)
  updateStock: async (req, res, next) => {
    try {
      const { quantityChange, transactionType, notes } = req.body;

      if (!quantityChange || !transactionType) {
        return res.status(400).json({
          success: false,
          message: 'Quantity change and transaction type are required'
        });
      }

      const result = await inventoryService.updateStock(
        req.params.id,
        quantityChange,
        transactionType,
        req.user.userId,
        notes
      );

      res.json({
        success: true,
        message: 'Stock updated successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  },

  // DELETE /api/inventory/:id (Admin only)
  delete: async (req, res, next) => {
    try {
      const result = await inventoryService.deleteProduct(req.params.id);

      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/inventory/alerts/low-stock
  getLowStock: async (req, res, next) => {
    try {
      const items = await inventoryService.getLowStockItems();

      res.json({
        success: true,
        count: items.length,
        data: items
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = inventoryController;