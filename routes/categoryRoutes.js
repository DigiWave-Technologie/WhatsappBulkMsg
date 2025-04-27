const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const categoryController = require('../controllers/categoryController');

// Create a new category
router.post('/', authenticateToken, categoryController.createCategory);

// Get all categories
router.get('/', authenticateToken, categoryController.getAllCategories);

// Get a single category
router.get('/:id', authenticateToken, categoryController.getCategoryById);

// Update a category
router.put('/:id', authenticateToken, categoryController.updateCategory);

// Delete a category
router.delete('/:id', authenticateToken, categoryController.deleteCategory);

module.exports = router; 