const express = require("express");
const router = express.Router();
const campaignController = require("../controllers/campaignController");
const multer = require("multer");
const { authenticateToken } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permissions');

// Use memoryStorage so files are kept in memory as Buffers.
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Accept fields including "userprofile", "excellsheet", and other media fields.
router.post(
  "/sendCampaign",
  upload.fields([
    { name: "userprofile", maxCount: 1 },
    { name: "excellsheet", maxCount: 1 }, // New field added here
    { name: "image1", maxCount: 1 },
    { name: "image2", maxCount: 1 },
    { name: "image3", maxCount: 1 },
    { name: "image4", maxCount: 1 },
    { name: "pdf", maxCount: 1 },
    { name: "video", maxCount: 1 },
  ]),
  campaignController.createCampaign
);

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Check if user has permission to manage campaigns
router.use(checkPermission('manage_campaigns'));

// Get all campaigns
router.get('/', campaignController.getCampaigns);

// Get campaign by ID
router.get('/:id', campaignController.getCampaignById);

// Create new campaign
router.post('/',
    campaignController.validateCampaign,
    campaignController.createCampaign
);

// Update campaign
router.put('/:id',
    campaignController.validateCampaign,
    campaignController.updateCampaign
);

// Delete campaign
router.delete('/:id', campaignController.deleteCampaign);

// Campaign actions
router.post('/:id/start', campaignController.startCampaign);
router.post('/:id/pause', campaignController.pauseCampaign);
router.post('/:id/resume', campaignController.resumeCampaign);
router.post('/:id/cancel', campaignController.cancelCampaign);

// Campaign analytics
router.get('/:id/stats', campaignController.getCampaignStats);
router.get('/:id/reports', campaignController.getCampaignDeliveryReports);

// Campaign management routes
router.post('/', campaignController.createCampaign);
router.get('/', campaignController.getUserCampaigns);
router.get('/:campaignId', campaignController.getCampaignById);
router.delete('/:campaignId', campaignController.deleteCampaign);

// Campaign control routes
router.post('/:campaignId/start', campaignController.startCampaign);
router.post('/:campaignId/pause', campaignController.pauseCampaign);
router.post('/:campaignId/resume', campaignController.resumeCampaign);
router.post('/:campaignId/stop', campaignController.cancelCampaign);

// Get recipient status
router.get('/:id/recipients/:phone', campaignController.getRecipientStatus);

module.exports = router;
