const express = require('express');
const router = express.Router();
const whatsappController = require('../controllers/whatsappController');
const { authenticateToken } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// WhatsApp configuration routes
router.post('/configure', whatsappController.configureWhatsApp);
router.get('/config', whatsappController.getWhatsAppConfig);

// Message routes
router.post('/send', whatsappController.sendMessage);

// Template routes
router.get('/templates', whatsappController.getTemplates);
router.post('/templates', whatsappController.createTemplate);

module.exports = router; 