const PersonalCampaign = require('../models/PersonalCampaign');
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
    } = campaignData;

    // Validate required fields
    if (!userMessage) {
      throw new ApiError(400, 'userMessage is required.');
    }

    const campaign = new PersonalCampaign({
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
    });

    await campaign.save();
    return campaign;
  } catch (error) {
    throw error;
  }
};

exports.getAllPersonalCampaigns = async () => {
  try {
    const campaigns = await PersonalCampaign.find()
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

exports.getPersonalCampaignById = async (campaignId) => {
  try {
    const campaign = await PersonalCampaign.findById(campaignId)
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
