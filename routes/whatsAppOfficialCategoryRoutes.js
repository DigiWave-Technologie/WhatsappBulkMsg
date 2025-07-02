const express = require('express');
const router = express.Router();
const whatsAppOfficialCategoryController = require('../controllers/whatsAppOfficialCategoryController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Super Admin routes
router.post('/', authorizeRole('super_admin'), whatsAppOfficialCategoryController.createCategory);
router.put('/:id', authorizeRole('super_admin'), whatsAppOfficialCategoryController.updateCategory);
router.delete('/:id', authorizeRole('super_admin'), whatsAppOfficialCategoryController.deleteCategory);

// Admin and User routes
router.get('/', whatsAppOfficialCategoryController.getCategories);
router.get('/:id', whatsAppOfficialCategoryController.getCategoryById);

module.exports = router; 