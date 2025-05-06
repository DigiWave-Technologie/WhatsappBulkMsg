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
const Campaign = require('../models/Campaign');
const Template = require('../models/Template');
const Group = require('../models/Group'); // Represents contact groups
const whatsappService = require('../services/whatsappService');

const setDefaultUserProfile = async (numbers, instance) => {
  console.log(`Setting default profile for ${numbers} on instance ${instance}`);
  return Promise.resolve();
};

// Create campaign
const createCampaign = asyncHandler(async (req, res) => {
  try {
    // Destructure all potential fields from the body
    const {
        name,
        templateId,
        contactGroupId, // ID of the contact group (for individual type)
        scheduleTime,   // Keep existing scheduleTime if used
        targetType,     // 'individual', 'group', 'community', 'channel'
        targetId        // WhatsApp Group/Community/Channel ID
    } = req.body;
    const userId = req.user.id; // Assuming user ID is available from auth middleware

    // Basic validation
    if (!name || !templateId) {
        return res.status(400).json({ message: 'Campaign name and template ID are required.' });
    }

    // Construct data object for the service
    const campaignData = {
        name,
        templateId,
        contactGroupId, // Pass it along, service will validate based on type
        scheduledAt: scheduleTime ? new Date(scheduleTime) : null, // Use scheduledAt consistently
        targetType: targetType || 'individual', // Default to individual if not provided
        targetId
    };

    // Call the service function
    const campaign = await campaignService.createCampaign(userId, campaignData);

    res.status(201).json({
        success: true,
        message: 'Campaign created successfully',
        data: campaign
    });

  } catch (error) {
    // Log the error for debugging
    console.error("Error creating campaign:", error);
    // Send appropriate error response
    res.status(error.message.includes('not found') || error.message.includes('required') ? 400 : 500).json({
        success: false,
        message: 'Error creating campaign',
        error: error.message
    });
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
  const { name, templateId, groupId, scheduleTime } = req.body;
  const campaign = await Campaign.findById(req.params.id);

  if (!campaign) {
    return res.status(404).json({ message: 'Campaign not found' });
  }

  // Check if user has access to this campaign
  if (campaign.userId.toString() !== req.user.id) {
    return res.status(403).json({ message: 'Access denied' });
  }

  // Check if campaign can be updated
  if (campaign.status !== 'draft') {
    return res.status(400).json({ message: 'Only draft campaigns can be updated' });
  }

  // Update fields
  if (name) campaign.name = name;
  if (templateId) campaign.templateId = templateId;
  if (groupId) {
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }
    campaign.groupId = groupId;
    campaign.recipients = group.contacts.map(contact => ({
      phone: contact.phone
    }));
  }
  if (scheduleTime) campaign.scheduleTime = scheduleTime;

  await campaign.save();
  res.json(campaign);
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
const pauseCampaign = asyncHandler(async (req, res) => {
    const { campaignId } = req.params;
    const userId = req.user.id;

    const campaign = await campaignService.pauseCampaign(userId, campaignId);

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

    const campaign = await campaignService.resumeCampaign(userId, campaignId);

    res.status(200).json({
        success: true,
        message: 'Campaign resumed successfully',
        data: campaign
    });
});

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
const getCampaignStats = asyncHandler(async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    // Check if user has access to this campaign
    if (campaign.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(campaign.stats);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving campaign statistics', error: error.message });
  }
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

module.exports = {
  createCampaign,
  getCampaigns,
  getCampaignById,
  updateCampaign,
  deleteCampaign,
  startCampaign,
  pauseCampaign,    // <-- Add new export
  resumeCampaign,   // <-- Add new export
  cancelCampaign,   // <-- Add new export (assuming you had it or want it)
  rerunCampaign,    // <-- Add new export
  getCampaignStats,
  getCampaignDeliveryReports,
  validateCampaign,
  getUserCampaigns,
  getRecipientStatus
};
