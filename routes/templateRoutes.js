const express = require('express');
const router = express.Router();
const templateController = require('../controllers/templateController');
const { authenticateToken } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permissions');

// Protect all template routes
router.use(authenticateToken);

// All routes below require authentication
router.get('/', templateController.getUserTemplates);
router.get('/pending', checkPermission('approve_templates'), templateController.getPendingTemplates);
router.get('/:templateId', templateController.getTemplateById);
router.post('/', templateController.createTemplate);
router.put('/:templateId', templateController.updateTemplate);
router.delete('/:templateId', templateController.deleteTemplate);
router.post('/:templateId/approve', checkPermission('approve_templates'), templateController.approveTemplate);
router.post('/:templateId/reject', checkPermission('approve_templates'), templateController.rejectTemplate);

module.exports = router; 