const express = require('express');
const router = express.Router();
const whatsappController = require('../controllers/whatsappController');
const { authenticateToken } = require('../middleware/auth');
const whatsappService = require('../services/whatsappService');

// Message routes
router.post('/send', authenticateToken, whatsappController.sendMessage);
router.post('/template', authenticateToken, whatsappController.sendTemplate);
router.get('/status/:messageId', authenticateToken, whatsappController.getMessageStatus);

// Number validation route
router.get('/validate/:phoneNumber', authenticateToken, whatsappController.validateNumber);

// Business profile routes
router.get('/profile', authenticateToken, whatsappController.getBusinessProfile);
router.put('/profile', authenticateToken, whatsappController.updateBusinessProfile);

// Route to send template message
router.post('/send-template', async (req, res) => {
    try {
        const { to, templateName, languageCode } = req.body;
        
        const result = await whatsappService.sendTemplateMessage(
            to,
            templateName || 'hello_world',
            languageCode || 'en_US'
        );
        
        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error sending template message:', error.response?.data || error.message);
        res.status(500).json({
            success: false,
            error: error.response?.data || error.message
        });
    }
});

// Route to send text message
router.post('/send-text', async (req, res) => {
    try {
        const { to, message } = req.body;
        
        const result = await whatsappService.sendTextMessage(to, message);
        
        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error sending text message:', error.response?.data || error.message);
        res.status(500).json({
            success: false,
            error: error.response?.data || error.message
        });
    }
});

module.exports = router; 