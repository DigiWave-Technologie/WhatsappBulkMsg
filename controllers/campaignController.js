const campaignService = require("../services/campaignService");
const { uploadFileToS3 } = require("../utils/awsS3");
const { sendWhatsAppMessages } = require("../services/waMessageService");
const { sendMediaMessage } = require("../services/waMediaService");
// const { setWaUserProfile } = require("../services/waUserprofileService");
const { getRandomInstance } = require("../utils/RandomInstance");
// const { sendInteractiveMessage } = require("../services/waButtonService");
// Import the credit service function
const creditService = require("../services/creditsService");
const { asyncHandler, ApiError } = require('../middleware/errorHandler');
const { validatePhoneNumber } = require('../utils/validators');
const Campaign = require('../models/Campaign');
const Template = require('../models/Template');
const Group = require('../models/Group'); // Represents contact groups
const whatsappService = require('../services/whatsappService');
const campaignProcessor = require('../services/campaignProcessor');

const setDefaultUserProfile = async (numbers, instance) => {
  console.log(`Setting default profile for ${numbers} on instance ${instance}`);
  return Promise.resolve();
};

// Create campaign
const createCampaign = asyncHandler(async (req, res) => {
    console.log('Received campaign data:', req.body);
    const campaignData = {
        ...req.body,
        userId: req.user._id
    };

    const campaign = await campaignService.createCampaign(campaignData);
    res.status(201).json({
        success: true,
        message: 'Campaign created successfully',
        data: campaign
    });
});

// Get all campaigns
const getCampaigns = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, status, type, startDate, endDate } = req.query;
    const filters = { status, type, startDate, endDate };
    
    const campaigns = await campaignService.getCampaigns(
        req.user._id,
        filters,
        parseInt(page),
        parseInt(limit)
    );

    res.status(200).json({
        success: true,
        message: 'Campaigns retrieved successfully',
        data: campaigns
    });
});

// Get campaign by ID
const getCampaignById = asyncHandler(async (req, res) => {
    const { campaignId } = req.params;
    const userId = req.user._id;

    const campaign = await campaignService.getCampaignById(campaignId, userId);

    res.status(200).json({
        success: true,
        data: campaign
    });
});

// Update campaign
const updateCampaign = asyncHandler(async (req, res) => {
    const { campaignId } = req.params;
    const userId = req.user._id;
    const updateData = req.body;

    const campaign = await campaignService.updateCampaign(campaignId, updateData, userId);

    res.status(200).json({
        success: true,
        message: 'Campaign updated successfully',
        data: campaign
    });
});

// Delete campaign
const deleteCampaign = asyncHandler(async (req, res) => {
    const { campaignId } = req.params;
    const userId = req.user._id;

    await campaignService.deleteCampaign(campaignId, userId);

    res.status(200).json({
        success: true,
        message: 'Campaign deleted successfully'
    });
});

// Start campaign
const startCampaign = asyncHandler(async (req, res) => {
    const { campaignId } = req.params;
    const userId = req.user._id;

    // Verify campaign ownership
    const campaign = await campaignService.getCampaignById(campaignId, userId);
    if (!campaign) {
        throw new ApiError(404, 'Campaign not found');
    }

    // Start campaign processing
    campaignProcessor.processCampaign(campaignId).catch(error => {
        console.error(`Error processing campaign ${campaignId}:`, error);
    });

    res.status(200).json({
        success: true,
        message: 'Campaign started successfully'
    });
});

// Pause campaign
const pauseCampaign = asyncHandler(async (req, res) => {
    const { campaignId } = req.params;
    const userId = req.user._id;

    const campaign = await campaignService.getCampaignById(campaignId, userId);
    if (!campaign) {
        throw new ApiError(404, 'Campaign not found');
    }

    await campaign.pause();

    res.status(200).json({
        success: true,
        message: 'Campaign paused successfully'
    });
});

// Resume campaign
const resumeCampaign = asyncHandler(async (req, res) => {
    const { campaignId } = req.params;
    const userId = req.user._id;

    const campaign = await campaignService.getCampaignById(campaignId, userId);
    if (!campaign) {
        throw new ApiError(404, 'Campaign not found');
    }

    await campaign.resume();

    res.status(200).json({
        success: true,
        message: 'Campaign resumed successfully'
    });
});

// Cancel campaign
const cancelCampaign = asyncHandler(async (req, res) => {
    const { campaignId } = req.params;
    const userId = req.user._id;

    const campaign = await campaignService.getCampaignById(campaignId, userId);
    if (!campaign) {
        throw new ApiError(404, 'Campaign not found');
    }

    await campaign.cancel();

    res.status(200).json({
        success: true,
        message: 'Campaign cancelled successfully'
    });
});

// Get campaign stats
const getCampaignStats = asyncHandler(async (req, res) => {
    const { campaignId } = req.params;
    const userId = req.user._id;

    const campaign = await campaignService.getCampaignById(campaignId, userId);
    if (!campaign) {
        throw new ApiError(404, 'Campaign not found');
    }

    res.status(200).json({
        success: true,
        data: campaign.stats
    });
});

// Get campaign delivery reports
const getCampaignDeliveryReports = asyncHandler(async (req, res) => {
    const { campaignId } = req.params;
    const userId = req.user._id;

    const campaign = await campaignService.getCampaignById(campaignId, userId);
    if (!campaign) {
        throw new ApiError(404, 'Campaign not found');
    }

    const reports = campaign.recipients.map(recipient => ({
        phoneNumber: recipient.phoneNumber,
        status: recipient.status,
        metadata: recipient.metadata
    }));

    res.status(200).json({
        success: true,
        data: reports
    });
});

// Get user's campaigns
const getUserCampaigns = async (req, res) => {
  try {
    const userId = req.user.userId;
    const filters = req.query;
    const campaigns = await campaignService.getUserCampaigns(userId, filters);
    res.status(200).json({
      success: true,
      data: campaigns
    });
  } catch (error) {
    res.status(error.statusCode || 400).json({
      success: false,
      message: error.message
    });
  }
};

// Check recipient status
const getRecipientStatus = asyncHandler(async (req, res) => {
  try {
    const { phone } = req.params;
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    // Check if user has access to this campaign
    if (campaign.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const recipient = campaign.recipients.find(r => r.phone === phone);
    if (!recipient) {
      return res.status(404).json({ message: 'Recipient not found in campaign' });
    }

    res.json(recipient);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving recipient status', error: error.message });
  }
});

// Schedule campaign
const scheduleCampaign = asyncHandler(async (req, res) => {
    const { campaignId } = req.params;
    const { scheduledTime } = req.body;
    const userId = req.user._id;

    const campaign = await campaignService.getCampaignById(campaignId, userId);
    if (!campaign) {
        throw new ApiError(404, 'Campaign not found');
    }

    await campaignService.scheduleCampaign(campaignId, scheduledTime);

    res.status(200).json({
        success: true,
        message: 'Campaign scheduled successfully'
    });
});

// Rerun campaign
const rerunCampaign = asyncHandler(async (req, res) => {
    const { campaignId } = req.params;
    const userId = req.user._id;

    const campaign = await campaignService.getCampaignById(campaignId, userId);
    if (!campaign) {
        throw new ApiError(404, 'Campaign not found');
    }

    // Create a new campaign based on the existing one
    const newCampaign = await campaignService.rerunCampaign(campaignId);

    res.status(200).json({
        success: true,
        message: 'Campaign rerun created successfully',
        data: newCampaign
    });
});

// Upload CSV for campaign recipients
const uploadCSV = async (req, res) => {
  try {
    if (!req.file) {
      throw new ApiError(400, 'No CSV file uploaded');
    }

    const csvData = {
      url: req.file.path,
      filename: req.file.filename,
      totalRows: 0 // This will be updated after processing
    };

    res.status(200).json({
      success: true,
      message: 'CSV file uploaded successfully',
      data: csvData
    });
  } catch (error) {
    res.status(error.statusCode || 400).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  createCampaign,
  getCampaigns,
  getCampaignById,
  updateCampaign,
  deleteCampaign,
  startCampaign,
  scheduleCampaign,
  pauseCampaign,
  resumeCampaign,
  cancelCampaign,
  rerunCampaign,
  getCampaignStats,
  getCampaignDeliveryReports,
  getUserCampaigns,
  getRecipientStatus,
  uploadCSV
};
