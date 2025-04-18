const express = require('express');
const router = express.Router();
const apiController = require('../controllers/apiController');
const { authenticateToken } = require('../middleware/auth');
const { authenticateApiKey } = require('../middleware/apiAuth');

// API Key Management (requires user authentication)
router.post('/key/generate', authenticateToken, apiController.generateApiKey);
router.post('/key/revoke', authenticateToken, apiController.revokeApiKey);

// API endpoints (requires API key authentication)
router.post('/message/send', authenticateApiKey, apiController.sendMessage);
router.post('/campaign/send', authenticateApiKey, apiController.sendCampaign);
router.post('/template/create', authenticateApiKey, apiController.createTemplate);
router.post('/group/create', authenticateApiKey, apiController.createGroup);
router.post('/number/scan', authenticateApiKey, apiController.scanWhatsappNumber);
router.get('/credits/history', authenticateApiKey, apiController.getCreditHistory);
router.get('/reports', authenticateApiKey, apiController.getReports);

module.exports = router; 