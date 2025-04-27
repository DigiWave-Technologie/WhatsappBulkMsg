const express = require('express');
const router = express.Router();
const whatsappController = require('../controllers/whatsappController');
const { authenticateToken } = require('../middleware/auth');

// Message routes
router.post('/send', authenticateToken, whatsappController.sendMessage);
router.post('/template', authenticateToken, whatsappController.sendTemplate);
router.get('/status/:messageId', authenticateToken, whatsappController.getMessageStatus);

// Number validation route
router.get('/validate/:phoneNumber', authenticateToken, whatsappController.validateNumber);

// Business profile routes
router.get('/profile', authenticateToken, whatsappController.getBusinessProfile);
router.put('/profile', authenticateToken, whatsappController.updateBusinessProfile);

module.exports = router; 