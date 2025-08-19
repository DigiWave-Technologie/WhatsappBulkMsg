const express = require('express');
const router = express.Router();
const developerApiController = require('../controllers/developerApiController');
const whatsappOfficialRoutes = require('./whatsappOfficialRoutes');
const { authenticateApiKey, authenticateToken } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../uploads/whatsapp-media');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname.replace(/\s+/g, '_'));
    }
});
const upload = multer({ storage });

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

// ===== WhatsApp Official Media Upload Endpoint =====
router.use('/whatsapp-official', whatsappOfficialRoutes);

// ===== Number Validation Endpoint =====
router.post('/validate-numbers', authenticateApiKey, developerApiController.validateNumbers);

// ===== Reports Endpoints =====
router.get('/reports/messages', authenticateApiKey, developerApiController.getMessageReports);
router.get('/reports/campaigns', authenticateApiKey, developerApiController.getCampaignReports);
router.get('/reports/general', authenticateApiKey, developerApiController.getGeneralReports);

module.exports = router;