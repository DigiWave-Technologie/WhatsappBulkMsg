const express = require('express');
const router = express.Router();
const whatsappController = require('../controllers/whatsappController');
const { authenticateToken } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// WhatsApp Configuration Routes
router.get('/configs', whatsappController.getWhatsAppConfigs);
router.post('/configure', whatsappController.configureWhatsApp);
router.put('/config', whatsappController.updateWhatsAppConfig);
router.delete('/config/:phoneNumber', whatsappController.deleteWhatsAppConfig);

// WhatsApp Message Routes
router.post('/send', whatsappController.sendMessage);

// WhatsApp Template Routes
router.get('/templates', whatsappController.getTemplates);
router.post('/templates', whatsappController.createTemplate);

module.exports = router;