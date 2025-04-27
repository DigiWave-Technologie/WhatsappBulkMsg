const campaignService = require("../services/campaignService");
const { uploadFileToS3 } = require("../utils/awsS3");
const { sendWhatsAppMessages } = require("../services/waMessageService");
const { sendMediaMessage } = require("../services/waMediaService");
// const { setWaUserProfile } = require("../services/waUserprofileService");
const { getRandomInstance } = require("../utils/RandomInstance");
// const { sendInteractiveMessage } = require("../services/waButtonService");
// Import the credit service function
const creditService = require("../services/creditsService");
const { asyncHandler } = require('../middleware/errorHandler');
const { validatePhoneNumber } = require('../utils/helpers');

const setDefaultUserProfile = async (numbers, instance) => {
  console.log(`Setting default profile for ${numbers} on instance ${instance}`);
  return Promise.resolve();
};

// Create campaign
const createCampaign = asyncHandler(async (req, res) => {
  try {
    const campaignData = req.body;
    const userId = req.user.id;

    const campaign = await campaignService.createCampaign(campaignData, userId);

    res.status(201).json({
      success: true,
      message: 'Campaign created successfully',
      data: campaign
    });
  } catch (error) {
    console.error("Error in campaignController:", error);
    res.status(500).json({ error: "Failed to create campaign" });
  }
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
  const userId = req.user.id;

  const campaign = await campaignService.getCampaignById(campaignId, userId);

  res.status(200).json({
    success: true,
    data: campaign
  });
});

// Update campaign
const updateCampaign = asyncHandler(async (req, res) => {
  const campaign = await campaignService.updateCampaign(
    req.params.id,
    req.user._id,
    req.body
  );
  res.status(200).json({
    success: true,
    message: 'Campaign updated successfully',
    data: campaign
  });
});

// Delete campaign
const deleteCampaign = asyncHandler(async (req, res) => {
  const { campaignId } = req.params;
  const userId = req.user.id;

  const result = await campaignService.deleteCampaign(campaignId, userId);

  res.status(200).json({
    success: true,
    message: result.message
  });
});

// Start campaign
const startCampaign = asyncHandler(async (req, res) => {
  const { campaignId } = req.params;
  const userId = req.user.id;

  const campaign = await campaignService.startCampaign(campaignId, userId);

  res.status(200).json({
    success: true,
    message: 'Campaign started successfully',
    data: campaign
  });
});

// Pause campaign
const pauseCampaign = asyncHandler(async (req, res) => {
  const { campaignId } = req.params;
  const userId = req.user.id;

  const campaign = await campaignService.pauseCampaign(campaignId, userId);

  res.status(200).json({
    success: true,
    message: 'Campaign paused successfully',
    data: campaign
  });
});

// Resume campaign
const resumeCampaign = asyncHandler(async (req, res) => {
  const { campaignId } = req.params;
  const userId = req.user.id;

  const campaign = await campaignService.resumeCampaign(campaignId, userId);

  res.status(200).json({
    success: true,
    message: 'Campaign resumed successfully',
    data: campaign
  });
});

// Cancel campaign
const cancelCampaign = asyncHandler(async (req, res) => {
  const campaign = await campaignService.cancelCampaign(req.params.id, req.user._id);
  res.status(200).json({
    success: true,
    message: 'Campaign cancelled successfully',
    data: campaign
  });
});

// Get campaign statistics
const getCampaignStats = asyncHandler(async (req, res) => {
  const stats = await campaignService.getCampaignStats(req.params.id, req.user._id);
  res.status(200).json({
    success: true,
    message: 'Campaign statistics retrieved successfully',
    data: stats
  });
});

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

// Validate campaign data
const validateCampaign = asyncHandler(async (req, res, next) => {
  const { recipients, schedule, type } = req.body;

  // Validate recipients
  if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
    throw new Error('Recipients are required and must be an array');
  }

  // Validate phone numbers
  recipients.forEach(recipient => {
    if (!recipient.phoneNumber) {
      throw new Error('Phone number is required for each recipient');
    }
    validatePhoneNumber(recipient.phoneNumber);
  });

  // Validate schedule
  if (!schedule || !schedule.startAt) {
    throw new Error('Schedule start time is required');
  }

  // Validate recurring campaign data
  if (type === 'recurring') {
    if (!req.body.recurringSchedule || !req.body.recurringSchedule.frequency) {
      throw new Error('Recurring schedule frequency is required for recurring campaigns');
    }
  }

  next();
});

// Get user's campaigns
const getUserCampaigns = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const filters = req.query;

  const campaigns = await campaignService.getUserCampaigns(userId, filters);

  res.status(200).json({
    success: true,
    data: campaigns
  });
});

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
  getCampaignStats,
  getCampaignDeliveryReports,
  validateCampaign,
  getUserCampaigns
};
