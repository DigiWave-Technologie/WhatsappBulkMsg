const express = require("express");
const router = express.Router();
const campaignController = require("../controllers/campaignController");
// Assuming multer setup is needed for potential future file uploads in campaign creation/updates,
// but removing the specific '/sendCampaign' route as the main POST '/' seems to handle creation.
// const multer = require("multer");
const { authenticateToken } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permissions');

// Use memoryStorage so files are kept in memory as Buffers.
// const storage = multer.memoryStorage();
// const upload = multer({ storage });

// Apply authentication middleware to all routes below this point
router.use(authenticateToken);

// Check if user has permission to manage campaigns for routes below this point
router.use(checkPermission('manage_campaigns'));

// --- Standard CRUD Routes ---

// Get all campaigns for the user
router.get('/', campaignController.getCampaigns);

// Get a specific campaign by ID
router.get('/:id', campaignController.getCampaignById);

// Create a new campaign
// Assuming 'validateCampaign' middleware exists in campaignController
router.post('/',
    // campaignController.validateCampaign, // Uncomment if validation middleware exists
    campaignController.createCampaign
);

// Update an existing campaign
// Assuming 'validateCampaign' middleware exists in campaignController
router.put('/:id',
    // campaignController.validateCampaign, // Uncomment if validation middleware exists
    campaignController.updateCampaign
);

// Delete a campaign
router.delete('/:id', campaignController.deleteCampaign);

// --- Campaign Action Routes ---

// Start a campaign
router.post('/:id/start', campaignController.startCampaign);

// Pause a running campaign
router.post('/:id/pause', campaignController.pauseCampaign);

// Resume a paused campaign
router.post('/:id/resume', campaignController.resumeCampaign);

// Cancel a campaign (maps to stop/cancel)
router.post('/:id/cancel', campaignController.cancelCampaign); // Renamed from '/stop' for consistency

// --- Campaign Analytics & Reporting ---

// Get statistics for a campaign
router.get('/:id/stats', campaignController.getCampaignStats);

// Get delivery reports for a campaign
router.get('/:id/reports', campaignController.getCampaignDeliveryReports);

// Get status for a specific recipient within a campaign
router.get('/:id/recipients/:phone', campaignController.getRecipientStatus);

module.exports = router;
