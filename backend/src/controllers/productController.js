// backend/src/controllers/productController.js
const db = require('../config/database');

const productController = {
  // GET /api/categories - Get all product types
  getAll: async (req, res, next) => {
    try {
      const [productTypes] = await db.query(
        'SELECT * FROM ProductTypes ORDER BY product_type_name'
      );

      res.json({
        success: true,
        count: productTypes.length,
        data: productTypes
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/categories/:id - Get single product type
  getById: async (req, res, next) => {
    try {
      const [productTypes] = await db.query(
        'SELECT * FROM ProductTypes WHERE product_type_id = ?',
        [req.params.id]
      );

      if (productTypes.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Product type not found'
        });
      }

      res.json({
        success: true,
        data: productTypes[0]
      });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/categories - Create new product type (Admin only)
  create: async (req, res, next) => {
    try {
      const { productTypeName, description } = req.body;

      if (!productTypeName) {
        return res.status(400).json({
          success: false,
          message: 'Product type name is required'
        });
      }

      // Check if product type already exists
      const [existing] = await db.query(
        'SELECT * FROM ProductTypes WHERE product_type_name = ?',
        [productTypeName]
      );

      if (existing.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Product type already exists'
        });
      }

      const [result] = await db.query(
        'INSERT INTO ProductTypes (product_type_name, description) VALUES (?, ?)',
        [productTypeName, description || null]
      );

      res.status(201).json({
        success: true,
        message: 'Product type created successfully',
        data: {
          productTypeId: result.insertId,
          productTypeName,
          description
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // PUT /api/categories/:id - Update product type (Admin only)
  update: async (req, res, next) => {
    try {
      const { productTypeName, description } = req.body;

      if (!productTypeName) {
        return res.status(400).json({
          success: false,
          message: 'Product type name is required'
        });
      }

      const [result] = await db.query(
        'UPDATE ProductTypes SET product_type_name = ?, description = ? WHERE product_type_id = ?',
        [productTypeName, description, req.params.id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Product type not found'
        });
      }

      res.json({
        success: true,
        message: 'Product type updated successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  // DELETE /api/categories/:id - Delete product type (Admin only)
  delete: async (req, res, next) => {
    try {
      // Check if product type is in use
      const [items] = await db.query(
        'SELECT COUNT(*) as count FROM Inventory WHERE product_type_id = ?',
        [req.params.id]
      );

      if (items[0].count > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot delete product type. ${items[0].count} items are using this product type.`
        });
      }

      const [result] = await db.query(
        'DELETE FROM ProductTypes WHERE product_type_id = ?',
        [req.params.id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Product type not found'
        });
      }

      res.json({
        success: true,
        message: 'Product type deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = productController;