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
const Group = require('../models/Group');
const whatsappService = require('../services/whatsappService');

const setDefaultUserProfile = async (numbers, instance) => {
  console.log(`Setting default profile for ${numbers} on instance ${instance}`);
  return Promise.resolve();
};

// Create campaign
const createCampaign = asyncHandler(async (req, res) => {
  try {
    const { name, templateId, groupId, scheduleTime } = req.body;

    // Validate template exists
    const template = await Template.findById(templateId);
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    // Validate group exists and get recipients
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Create campaign
    const campaign = new Campaign({
      name,
      userId: req.user.id,
      templateId,
      groupId,
      scheduleTime,
      recipients: group.contacts.map(contact => ({
        phone: contact.phone
      }))
    });

    await campaign.save();

    res.status(201).json(campaign);
  } catch (error) {
    res.status(500).json({ message: 'Error creating campaign', error: error.message });
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

// Start campaign
const startCampaign = asyncHandler(async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id)
      .populate('templateId')
      .populate('groupId');

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    // Check if user has access to this campaign
    if (campaign.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if campaign can be started
    if (campaign.status !== 'draft' && campaign.status !== 'scheduled') {
      return res.status(400).json({ message: 'Campaign cannot be started' });
    }

    // Check if scheduled time has been reached
    if (campaign.scheduleTime && campaign.scheduleTime > new Date()) {
      return res.status(400).json({ message: 'Campaign scheduled time has not been reached' });
    }

    // Check credits
    const requiredCredits = campaign.recipients.length;
    const hasCredits = await creditService.checkCredits(req.user.id, requiredCredits);
    if (!hasCredits) {
      return res.status(400).json({ message: 'Insufficient credits' });
    }

    // Update campaign status
    campaign.status = 'running';
    await campaign.save();

    // Start sending messages
    campaign.recipients.forEach(async (recipient) => {
      try {
        if (validatePhoneNumber(recipient.phone)) {
          const messageId = await whatsappService.sendTemplate(
            recipient.phone,
            campaign.templateId.name,
            campaign.templateId.language,
            campaign.templateId.components
          );

          recipient.status = 'sent';
          recipient.sentAt = new Date();
          await campaign.save();

          // Deduct credits
          await creditService.deductCredits(req.user.id, 1);
        } else {
          recipient.status = 'failed';
          recipient.error = 'Invalid phone number';
          await campaign.save();
        }
      } catch (error) {
        recipient.status = 'failed';
        recipient.error = error.message;
        await campaign.save();
      }
    });

    res.json({ message: 'Campaign started successfully', campaign });
  } catch (error) {
    res.status(500).json({ message: 'Error starting campaign', error: error.message });
  }
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
  pauseCampaign,
  resumeCampaign,
  cancelCampaign,
  getCampaignStats,
  getCampaignDeliveryReports,
  validateCampaign,
  getUserCampaigns,
  getRecipientStatus
};
