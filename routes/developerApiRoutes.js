const express = require('express');
const router = express.Router();
const developerApiController = require('../controllers/developerApiController');
const { authenticateApiKey, authenticateToken } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permissions');

// API Key authentication for external API calls
router.use(authenticateApiKey);

// API endpoints for external developers
router.post('/message/send', developerApiController.sendMessage);
router.post('/message/template', developerApiController.sendTemplateMessage);
router.post('/message/media', developerApiController.sendMediaMessage);

// Balance and account endpoints
router.get('/account/balance', developerApiController.getBalance);
router.get('/account/usage', developerApiController.getUsageHistory);

// Group management
router.post('/groups/create', developerApiController.createGroup);
router.get('/groups', developerApiController.getGroups);
router.put('/groups/:id', developerApiController.updateGroup);
router.delete('/groups/:id', developerApiController.deleteGroup);
router.post('/groups/:id/contacts', developerApiController.addContactsToGroup);

// Template management
router.post('/templates/create', developerApiController.createTemplate);
router.get('/templates', developerApiController.getTemplates);
router.put('/templates/:id', developerApiController.updateTemplate);
router.delete('/templates/:id', developerApiController.deleteTemplate);

// Number validation (if allowed by WhatsApp)
router.post('/numbers/validate', developerApiController.validateNumbers);

// Reports
router.get('/reports/messages', developerApiController.getMessageReports);
router.get('/reports/campaigns', developerApiController.getCampaignReports);
router.get('/reports/credits', developerApiController.getCreditHistory);

// Admin routes (require token auth + admin permission)
router.use('/admin', authenticateToken, checkPermission('manage_api_users'));
router.post('/admin/users', developerApiController.createApiUser);
router.get('/admin/users', developerApiController.getApiUsers);
router.put('/admin/users/:id', developerApiController.updateApiUser);
router.delete('/admin/users/:id', developerApiController.deleteApiUser);
router.post('/admin/users/:id/credits', developerApiController.addCreditsToUser);

module.exports = router;