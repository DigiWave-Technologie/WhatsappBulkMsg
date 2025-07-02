const express = require('express');
const router = express.Router();
const whatsAppOfficialTemplateController = require('../controllers/whatsAppOfficialTemplateController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Super Admin routes
router.post('/', authorizeRole('super_admin'), whatsAppOfficialTemplateController.createTemplate);
router.put('/:id', authorizeRole('super_admin'), whatsAppOfficialTemplateController.updateTemplate);
router.delete('/:id', authorizeRole('super_admin'), whatsAppOfficialTemplateController.deleteTemplate);
router.put('/:id/status', authorizeRole('super_admin'), whatsAppOfficialTemplateController.updateTemplateStatus);

// Admin and User routes
router.get('/', whatsAppOfficialTemplateController.getTemplates);
router.get('/:id', whatsAppOfficialTemplateController.getTemplateById);

module.exports = router; 