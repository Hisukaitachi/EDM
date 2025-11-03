// backend/src/controllers/categoryController.js
const db = require('../config/database');

const categoryController = {
  // GET /api/categories - Get all categories
  getAll: async (req, res, next) => {
    try {
      const [categories] = await db.query(
        'SELECT * FROM Categories ORDER BY category_name'
      );

      res.json({
        success: true,
        count: categories.length,
        data: categories
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/categories/:id - Get single category
  getById: async (req, res, next) => {
    try {
      const [categories] = await db.query(
        'SELECT * FROM Categories WHERE category_id = ?',
        [req.params.id]
      );

      if (categories.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }

      res.json({
        success: true,
        data: categories[0]
      });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/categories - Create new category (Admin only)
  create: async (req, res, next) => {
    try {
      const { categoryName, description } = req.body;

      if (!categoryName) {
        return res.status(400).json({
          success: false,
          message: 'Category name is required'
        });
      }

      // Check if category already exists
      const [existing] = await db.query(
        'SELECT * FROM Categories WHERE category_name = ?',
        [categoryName]
      );

      if (existing.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Category already exists'
        });
      }

      const [result] = await db.query(
        'INSERT INTO Categories (category_name, description) VALUES (?, ?)',
        [categoryName, description || null]
      );

      res.status(201).json({
        success: true,
        message: 'Category created successfully',
        data: {
          categoryId: result.insertId,
          categoryName,
          description
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // PUT /api/categories/:id - Update category (Admin only)
  update: async (req, res, next) => {
    try {
      const { categoryName, description } = req.body;

      if (!categoryName) {
        return res.status(400).json({
          success: false,
          message: 'Category name is required'
        });
      }

      const [result] = await db.query(
        'UPDATE Categories SET category_name = ?, description = ? WHERE category_id = ?',
        [categoryName, description, req.params.id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }

      res.json({
        success: true,
        message: 'Category updated successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  // DELETE /api/categories/:id - Delete category (Admin only)
  delete: async (req, res, next) => {
    try {
      // Check if category is in use
      const [items] = await db.query(
        'SELECT COUNT(*) as count FROM Inventory WHERE category_id = ?',
        [req.params.id]
      );

      if (items[0].count > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot delete category. ${items[0].count} items are using this category.`
        });
      }

      const [result] = await db.query(
        'DELETE FROM Categories WHERE category_id = ?',
        [req.params.id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }

      res.json({
        success: true,
        message: 'Category deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = categoryController;