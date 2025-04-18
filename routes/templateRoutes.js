const express = require('express');
const router = express.Router();
const templateController = require('../controllers/templateController');
const { authenticateToken } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permissions');

// Public routes
router.get('/', templateController.getUserTemplates);
router.get('/:templateId', templateController.getTemplateById);

// Protected routes
router.use(authenticateToken);

// Create template
router.post('/', templateController.createTemplate);

// Update template
router.put('/:templateId', templateController.updateTemplate);

// Delete template
router.delete('/:templateId', templateController.deleteTemplate);

// Admin only routes
router.use(checkPermission('approve_templates'));

// Get pending templates
router.get('/pending', templateController.getPendingTemplates);

// Approve template
router.post('/:templateId/approve', templateController.approveTemplate);

// Reject template
router.post('/:templateId/reject', templateController.rejectTemplate);

module.exports = router; 