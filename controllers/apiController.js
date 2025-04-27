const apiService = require('../services/apiService');
const creditService = require('../services/creditsService');
const campaignService = require('../services/campaignService');
const templateService = require('../services/templateService');
const groupService = require('../services/groupService');
const { validateDateRange } = require('../middleware/validation');

/**
 * Generate API key
 */
const generateApiKey = async (req, res) => {
  try {
    const result = await apiService.generateApiKey(req.user._id);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

/**
 * Revoke API key
 */
const revokeApiKey = async (req, res) => {
  try {
    const result = await apiService.revokeApiKey(req.user._id);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

/**
 * Send a message
 */
const sendMessage = async (req, res) => {
  try {
    const { recipient, message, template, media, variables } = req.body;
    
    if (!recipient) {
      return res.status(400).json({ success: false, error: 'Recipient is required' });
    }

    if (!message && !template) {
      return res.status(400).json({ success: false, error: 'Message or template is required' });
    }

    const result = await apiService.sendMessage(req.user._id, {
      recipient,
      message,
      template,
      media,
      variables
    });

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

/**
 * Create a template
 */
const createTemplate = async (req, res) => {
  try {
    const { name, content, category, language } = req.body;
    
    if (!name || !content || !category || !language) {
      return res.status(400).json({ 
        success: false, 
        error: 'Name, content, category, and language are required' 
      });
    }

    const template = await apiService.createTemplate(req.user._id, {
      name,
      content,
      category,
      language
    });

    res.json({ success: true, data: template });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

/**
 * Create a group
 */
const createGroup = async (req, res) => {
  try {
    const { name, contacts } = req.body;
    
    if (!name || !contacts || !Array.isArray(contacts) || contacts.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Name and contacts array are required' 
      });
    }

    const group = await apiService.createGroup(req.user._id, {
      name,
      contacts
    });

    res.json({ success: true, data: group });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

/**
 * Scan WhatsApp number
 */
const scanWhatsappNumber = async (req, res) => {
  try {
    const { number } = req.body;
    
    if (!number) {
      return res.status(400).json({ success: false, error: 'Number is required' });
    }

    const result = await apiService.scanWhatsappNumber(req.user._id, number);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

/**
 * Get credit history
 */
const getCreditHistory = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    validateDateRange(startDate, endDate);

    const transactions = await apiService.getCreditHistory(req.user._id, { startDate, endDate });
    res.json({ success: true, data: transactions });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

/**
 * Get reports
 */
const getReports = async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;
    validateDateRange(startDate, endDate);

    const reports = await apiService.getReports(req.user._id, { startDate, endDate, status });
    res.json({ success: true, data: reports });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

/**
 * Send a campaign
 */
const sendCampaign = async (req, res) => {
  try {
    const { 
      title, 
      type, 
      recipients, 
      message, 
      template, 
      media, 
      variables,
      scheduleDate,
      delayBetweenMessages
    } = req.body;

    if (!title || !type || !recipients || (!message && !template)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Title, type, recipients, and message/template are required' 
      });
    }

    const campaign = await apiService.sendCampaign(req.user._id, {
      title,
      type,
      recipients,
      message,
      template,
      media,
      variables,
      scheduleDate,
      delayBetweenMessages
    });

    res.json({ success: true, data: campaign });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

/**
 * Get user credits via API
 */
const getCredits = async (req, res) => {
  try {
    const userId = req.user.userId;
    const result = await creditService.getUserCreditsByUserId(userId);
    
    return res.status(200).json({
      success: true,
      message: 'Credits retrieved successfully',
      data: result
    });
  } catch (error) {
    console.error('Error retrieving credits:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve credits'
    });
  }
};

/**
 * Get credit transactions via API
 */
const getTransactions = async (req, res) => {
  try {
    const userId = req.user.userId;
    const result = await creditService.getCreditsTransactionByUserId(userId);
    
    return res.status(200).json({
      success: true,
      message: 'Transactions retrieved successfully',
      data: result
    });
  } catch (error) {
    console.error('Error retrieving transactions:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve transactions'
    });
  }
};

/**
 * Get campaigns via API
 */
const getCampaigns = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { status, startDate, endDate } = req.query;
    
    const result = await campaignService.getCampaigns(userId, status, startDate, endDate);
    
    return res.status(200).json({
      success: true,
      message: 'Campaigns retrieved successfully',
      data: result
    });
  } catch (error) {
    console.error('Error retrieving campaigns:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve campaigns'
    });
  }
};

/**
 * Create a campaign via API
 */
const createCampaign = async (req, res) => {
  try {
    const campaignData = req.body;
    const userId = req.user.userId;
    
    const result = await campaignService.createCampaign(userId, campaignData);
    
    return res.status(201).json({
      success: true,
      message: 'Campaign created successfully',
      data: result
    });
  } catch (error) {
    console.error('Error creating campaign:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create campaign'
    });
  }
};

/**
 * Get a campaign by ID via API
 */
const getCampaignById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    
    const result = await campaignService.getCampaignById(userId, id);
    
    return res.status(200).json({
      success: true,
      message: 'Campaign retrieved successfully',
      data: result
    });
  } catch (error) {
    console.error('Error retrieving campaign:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve campaign'
    });
  }
};

/**
 * Update a campaign via API
 */
const updateCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const userId = req.user.userId;
    
    const result = await campaignService.updateCampaign(userId, id, updateData);
    
    return res.status(200).json({
      success: true,
      message: 'Campaign updated successfully',
      data: result
    });
  } catch (error) {
    console.error('Error updating campaign:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update campaign'
    });
  }
};

/**
 * Delete a campaign via API
 */
const deleteCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    
    await campaignService.deleteCampaign(userId, id);
    
    return res.status(200).json({
      success: true,
      message: 'Campaign deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete campaign'
    });
  }
};

module.exports = {
  generateApiKey,
  revokeApiKey,
  sendMessage,
  createTemplate,
  createGroup,
  scanWhatsappNumber,
  getCreditHistory,
  getReports,
  sendCampaign,
  getCredits,
  getTransactions,
  getCampaigns,
  createCampaign,
  getCampaignById,
  updateCampaign,
  deleteCampaign
}; 