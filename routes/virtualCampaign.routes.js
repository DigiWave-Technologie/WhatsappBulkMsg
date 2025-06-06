const express = require('express');
const router = express.Router();
const { sendWhatsappBulkMsgs, getMessageStatus, getChatHistory, createTemplate, getTemplate } = require('../controllers/virtualCampaign.controller');
const { authenticateToken } = require('../middleware/auth');

// Send bulk messages with various campaign types
router.post('/send', authenticateToken, sendWhatsappBulkMsgs);

// Get message status
router.get('/message/:messageId/status', authenticateToken, getMessageStatus);

// Get chat history
router.get('/chat/:chatId/history', authenticateToken, getChatHistory);

// Template management
router.post('/templates', authenticateToken, createTemplate);
router.get('/templates/:templateId', authenticateToken, getTemplate);

module.exports = router;
