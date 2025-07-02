const express = require("express");
const router = express.Router();
const campaignController = require("../controllers/campaignController");
const { authMiddleware } = require('../middleware/authMiddleware');
const { validateCampaign } = require('../middleware/validationMiddleware');
const multer = require('multer');
const path = require('path');

// Configure multer for CSV uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/csv'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  }
});

// Apply authentication middleware to all routes below this point
router.use(authMiddleware);

// --- Standard CRUD Routes ---

// Get all campaigns for the user
router.get('/', campaignController.getCampaigns);

// Get a specific campaign by ID
router.get('/:id', campaignController.getCampaignById);

// Create a new campaign
router.post('/', validateCampaign, campaignController.createCampaign);

// Update an existing campaign
router.put('/:id', validateCampaign, campaignController.updateCampaign);

// Delete a campaign
router.delete('/:id', campaignController.deleteCampaign);

// --- Campaign Action Routes ---

// Start a campaign
router.post('/:id/start', campaignController.startCampaign);

// Schedule a campaign
router.post('/:id/schedule', campaignController.scheduleCampaign);

// Pause a running campaign
router.post('/:id/pause', campaignController.pauseCampaign);

// Resume a paused campaign
router.post('/:id/resume', campaignController.resumeCampaign);

// Cancel a campaign
router.post('/:id/cancel', campaignController.cancelCampaign);

// Rerun a campaign
router.post('/:id/rerun', campaignController.rerunCampaign);

// --- Campaign Analytics & Reporting ---

// Get statistics for a campaign
router.get('/:id/stats', campaignController.getCampaignStats);

// Get delivery reports for a campaign
router.get('/:id/reports', campaignController.getCampaignDeliveryReports);

// Get status for a specific recipient within a campaign
router.get('/:id/recipients/:phone', campaignController.getRecipientStatus);

// CSV upload for campaign recipients
router.post('/upload-csv', upload.single('csv'), campaignController.uploadCSV);

module.exports = router;
