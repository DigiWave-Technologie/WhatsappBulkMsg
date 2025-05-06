const InternationalPersonalCampaign = require('../models/InternationalPersonalCampaign');
const { ApiError } = require('../middleware/errorHandler');

exports.createCampaign = async (campaignData) => {
  try {
    const {
      campaignTitle,
      selectedGroup,
      whatsAppNumbers,
      userMessage,
      selectedTemplate,
      userprofile,
      button1Text,
      button1Number,
      button2Text,
      button2Url,
      image1,
      image2,
      image3,
      image4,
      pdf,
      video,
      excellsheet,
      image1Caption,
      image2Caption,
      image3Caption,
      image4Caption,
      pdfCaption,
      videoCaption,
      BetweenMessages,
      countryCode,
    } = campaignData;

    // Validate required fields
    if (!userMessage) {
      throw new ApiError(400, 'userMessage is required.');
    }
    if (!countryCode) {
      throw new ApiError(400, 'countryCode is required.');
    }

    const campaign = new InternationalPersonalCampaign({
      campaignTitle,
      selectedGroup,
      whatsAppNumbers,
      userMessage,
      selectedTemplate,
      userprofile,
      button1Text,
      button1Number,
      button2Text,
      button2Url,
      image1,
      image2,
      image3,
      image4,
      pdf,
      video,
      excellsheet,
      image1Caption,
      image2Caption,
      image3Caption,
      image4Caption,
      pdfCaption,
      videoCaption,
      BetweenMessages,
      countryCode,
    });

    await campaign.save();
    return campaign;
  } catch (error) {
    throw error;
  }
};

exports.getAllInternationalPersonalCampaigns = async () => {
  try {
    const campaigns = await InternationalPersonalCampaign.find()
      .sort({ createdAt: -1 })
      .populate('userprofile', 'username');

    return campaigns.map(campaign => {
      let numberCount = 0;
      if (campaign.whatsAppNumbers) {
        numberCount = campaign.whatsAppNumbers
          .split(/,|\r?\n/)
          .filter(num => num.trim() !== '').length;
      }
      return {
        campaignId: campaign._id,
        userName: campaign.userprofile.username,
        numberCount,
        campaignTitle: campaign.campaignTitle,
        campaignReport: 'No report available',
        campaignSubmitTime: campaign.createdAt,
      };
    });
  } catch (error) {
    throw error;
  }
};

exports.getInternationalPersonalCampaignById = async (campaignId) => {
  try {
    const campaign = await InternationalPersonalCampaign.findById(campaignId)
      .populate('userprofile', 'username');

    if (!campaign) {
      throw new ApiError(404, 'Campaign not found');
    }

    let numberCount = 0;
    if (campaign.whatsAppNumbers) {
      numberCount = campaign.whatsAppNumbers
        .split(/,|\r?\n/)
        .filter(num => num.trim() !== '').length;
    }

    return {
      campaignId: campaign._id,
      userName: campaign.userprofile.username,
      numberCount,
      campaignTitle: campaign.campaignTitle,
      campaignReport: 'No report available',
      campaignSubmitTime: campaign.createdAt,
    };
  } catch (error) {
    throw error;
  }
};
