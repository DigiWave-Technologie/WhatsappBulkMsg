const campaignCreditService = require('../services/campaignCreditService');

// Transfer credits between users
const transferCredits = async (req, res) => {
  try {
    const { toUserId, campaignId, amount, timeDuration } = req.body;
    const fromUserId = req.user.userId;

    const result = await campaignCreditService.transferCredits(
      fromUserId,
      toUserId,
      campaignId,
      amount,
      timeDuration
    );

    res.status(200).json({
      success: true,
      message: 'Credits transferred successfully',
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get user's campaign credits
const getUserCampaignCredits = async (req, res) => {
  try {
    const userId = req.user.userId;
    const credits = await campaignCreditService.getUserCampaignCredits(userId);
    
    res.status(200).json({
      success: true,
      message: 'Campaign credits retrieved successfully',
      data: credits
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Debit credits for campaign usage
const debitCredits = async (req, res) => {
  try {
    const { campaignId, amount } = req.body;
    const userId = req.user.userId;

    const result = await campaignCreditService.debitCredits(
      userId,
      campaignId,
      amount
    );

    res.status(200).json({
      success: true,
      message: 'Credits debited successfully',
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get credit transactions for a campaign
const getCampaignCreditTransactions = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const userId = req.user.userId;
    const filters = req.query;

    const transactions = await campaignCreditService.getCampaignCreditTransactions(
      userId,
      campaignId,
      filters
    );

    res.status(200).json({
      success: true,
      message: 'Campaign credit transactions retrieved successfully',
      data: transactions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Process refund for failed messages
const processRefund = async (req, res) => {
  try {
    const { campaignId, failedMessages, totalMessages } = req.body;
    const userId = req.user.userId;

    const result = await campaignCreditService.processRefund(
      userId,
      campaignId,
      failedMessages,
      totalMessages
    );

    res.status(200).json({
      success: true,
      message: 'Refund processed successfully',
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Update refund settings
const updateRefundSettings = async (req, res) => {
  try {
    const { campaignId, settings } = req.body;
    const userId = req.user.userId;

    const result = await campaignCreditService.updateRefundSettings(
      userId,
      campaignId,
      settings
    );

    res.status(200).json({
      success: true,
      message: 'Refund settings updated successfully',
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get refund statistics
const getRefundStats = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const userId = req.user.userId;

    const result = await campaignCreditService.getRefundStats(
      userId,
      campaignId
    );

    res.status(200).json({
      success: true,
      message: 'Refund statistics retrieved successfully',
      data: result.data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  transferCredits,
  getUserCampaignCredits,
  debitCredits,
  getCampaignCreditTransactions,
  processRefund,
  updateRefundSettings,
  getRefundStats
}; 