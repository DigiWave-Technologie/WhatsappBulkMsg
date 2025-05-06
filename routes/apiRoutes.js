const express = require('express');
const router = express.Router();
const developerApiController = require('../controllers/developerApiController');
const { authenticateApiKey } = require('../middleware/auth');

// ===== Message Sending Endpoints =====
router.post('/messages/text', authenticateApiKey, developerApiController.sendMessage);
router.post('/messages/template', authenticateApiKey, developerApiController.sendTemplateMessage);
router.post('/messages/media', authenticateApiKey, developerApiController.sendMediaMessage);

// ===== Account & Balance Endpoints =====
router.get('/account/balance', authenticateApiKey, developerApiController.getBalance);
router.get('/account/usage', authenticateApiKey, developerApiController.getUsageHistory);
router.get('/account/credits', authenticateApiKey, developerApiController.getCreditHistory);

// ===== Group Management Endpoints =====
router.post('/groups', authenticateApiKey, developerApiController.createGroup);
router.get('/groups', authenticateApiKey, developerApiController.getGroups);
router.put('/groups/:id', authenticateApiKey, developerApiController.updateGroup);
router.delete('/groups/:id', authenticateApiKey, developerApiController.deleteGroup);
router.post('/groups/:id/contacts', authenticateApiKey, developerApiController.addContactsToGroup);

// ===== Template Management Endpoints =====
router.post('/templates', authenticateApiKey, developerApiController.createTemplate);
router.get('/templates', authenticateApiKey, developerApiController.getTemplates);
router.put('/templates/:id', authenticateApiKey, developerApiController.updateTemplate);
router.delete('/templates/:id', authenticateApiKey, developerApiController.deleteTemplate);

// ===== Number Validation Endpoint =====
router.post('/validate-numbers', authenticateApiKey, developerApiController.validateNumbers);

// ===== Reports Endpoints =====
router.get('/reports/messages', authenticateApiKey, developerApiController.getMessageReports);
router.get('/reports/campaigns', authenticateApiKey, developerApiController.getCampaignReports);
router.get('/reports/general', authenticateApiKey, developerApiController.getGeneralReports);

module.exports = router;