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
const { validatePhoneNumber } = require('../utils/helpers');
const Campaign = require('../models/Campaign');
const Template = require('../models/Template');
const Group = require('../models/Group'); // Represents contact groups
const whatsappService = require('../services/whatsappService');

const setDefaultUserProfile = async (numbers, instance) => {
  console.log(`Setting default profile for ${numbers} on instance ${instance}`);
  return Promise.resolve();
};

// Create campaign
const createCampaign = async (req, res) => {
  try {
    console.log('DEBUG: Received campaignData:', JSON.stringify(req.body, null, 2));
    const campaignData = req.body;
    const userId = req.user.userId;
    const campaign = await campaignService.createCampaign(campaignData, userId);
    res.status(201).json({
      success: true,
      message: 'Campaign created successfully',
      data: campaign
    });
  } catch (error) {
    res.status(error.statusCode || 400).json({
      success: false,
      message: error.message
    });
  }
};

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
  const userId = req.user.id;

  const campaign = await campaignService.getCampaignById(campaignId, userId);

  res.status(200).json({
    success: true,
    data: campaign
  });
});

// Update campaign
const updateCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const userId = req.user.userId;
    const campaign = await campaignService.updateCampaign(id, updateData, userId);
    res.status(200).json({
      success: true,
      message: 'Campaign updated successfully',
      data: campaign
    });
  } catch (error) {
    res.status(error.statusCode || 400).json({
      success: false,
      message: error.message
    });
  }
};

// Delete campaign
const deleteCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    await campaignService.deleteCampaign(id, userId);
    res.status(200).json({
      success: true,
      message: 'Campaign deleted successfully'
    });
  } catch (error) {
    res.status(error.statusCode || 400).json({
      success: false,
      message: error.message
    });
  }
};

// Start campaign (Modified slightly to use service consistently)
const startCampaign = asyncHandler(async (req, res) => {
    const { campaignId } = req.params;
    const userId = req.user.id; // Assuming user ID from auth middleware

    const campaign = await campaignService.startCampaign(userId, campaignId);

    res.status(200).json({
        success: true,
        message: 'Campaign started successfully',
        data: campaign
    });
});

// Pause campaign
const pauseCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const campaign = await campaignService.pauseCampaign(id, userId);
    res.status(200).json({
      success: true,
      message: 'Campaign paused successfully',
      data: campaign
    });
  } catch (error) {
    res.status(error.statusCode || 400).json({
      success: false,
      message: error.message
    });
  }
};

// Resume campaign
const resumeCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const campaign = await campaignService.resumeCampaign(id, userId);
    res.status(200).json({
      success: true,
      message: 'Campaign resumed successfully',
      data: campaign
    });
  } catch (error) {
    res.status(error.statusCode || 400).json({
      success: false,
      message: error.message
    });
  }
};

// Cancel campaign
const cancelCampaign = asyncHandler(async (req, res) => {
    const { campaignId } = req.params;
    const userId = req.user.id;

    const campaign = await campaignService.cancelCampaign(userId, campaignId);

    res.status(200).json({
        success: true,
        message: 'Campaign cancelled successfully',
        data: campaign
    });
});

// Rerun campaign
const rerunCampaign = asyncHandler(async (req, res) => {
    const { campaignId } = req.params;
    const userId = req.user.id;

    const campaign = await campaignService.rerunCampaign(userId, campaignId);

    res.status(200).json({
        success: true,
        message: 'Campaign has been reset and is ready to be started again.',
        data: campaign // Return the reset campaign object
    });
});

// Get campaign statistics
const getCampaignStats = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const stats = await campaignService.getCampaignStats(id, userId);
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(error.statusCode || 400).json({
      success: false,
      message: error.message
    });
  }
};

// Get campaign delivery reports
const getCampaignDeliveryReports = asyncHandler(async (req, res) => {
  const { status, startDate, endDate } = req.query;
  const filters = { status, startDate, endDate };
  
  const reports = await campaignService.getCampaignDeliveryReports(
    req.params.id,
    req.user._id,
    filters
  );

  res.status(200).json({
    success: true,
    message: 'Campaign delivery reports retrieved successfully',
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

// Schedule a campaign
const scheduleCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const scheduleData = req.body;
    const userId = req.user.userId;
    const campaign = await campaignService.scheduleCampaign(id, scheduleData, userId);
    res.status(200).json({
      success: true,
      message: 'Campaign scheduled successfully',
      data: campaign
    });
  } catch (error) {
    res.status(error.statusCode || 400).json({
      success: false,
      message: error.message
    });
  }
};

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
  pauseCampaign,
  resumeCampaign,
  cancelCampaign,
  rerunCampaign,
  getCampaignStats,
  getCampaignDeliveryReports,
  getUserCampaigns,
  getRecipientStatus,
  scheduleCampaign,
  uploadCSV
};
