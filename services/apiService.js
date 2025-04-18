const Campaign = require('../models/Campaign');
const MessageLog = require('../models/MessageLog');
const User = require('../models/User');
const creditService = require('./creditsService');
const whatsappService = require('./whatsappService');

/**
 * Send a WhatsApp message via API
 */
const sendMessage = async (userId, to, message, media, template) => {
  try {
    // Check if user has sufficient credits
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    // If not super admin, check credits
    if (user.role !== 'superadmin') {
      // Determine credit type based on message type
      let creditType = 'virtual_credit'; // Default to virtual_credit
      
      if (media && media.length > 0) {
        // Determine credit type based on media type
        if (media.some(m => m.type === 'image')) {
          creditType = 'dp_virtual_credit';
        } else if (media.some(m => m.type === 'button')) {
          creditType = 'virtual_button_credit';
        }
      }
      
      // Check if user has sufficient credits
      const userCredit = await creditService.getSenderCredit(userId, creditType);
      if (userCredit < 1) {
        throw new Error('Insufficient credits');
      }
      
      // Deduct credit
      await creditService.decrementCreditByUserId(userId, 1);
    }
    
    // Send message via WhatsApp service
    const result = await whatsappService.sendMessage(to, message, media, template);
    
    // Log the message
    await MessageLog.create({
      userId,
      recipient: to,
      message,
      media,
      template,
      status: result.status,
      messageId: result.messageId,
      timestamp: new Date()
    });
    
    return result;
  } catch (error) {
    throw error;
  }
};

/**
 * Scan WhatsApp number via API
 */
const scanWhatsappNumber = async (userId, number) => {
  try {
    // Check if user has permission to scan numbers
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    // Only users with personal number can scan
    if (user.role !== 'user') {
      throw new Error('Only users with personal number can scan WhatsApp numbers');
    }
    
    // Scan number via WhatsApp service
    const result = await whatsappService.scanNumber(number);
    
    return result;
  } catch (error) {
    throw error;
  }
};

/**
 * Get campaign reports via API
 */
const getReports = async (userId, campaignId, startDate, endDate) => {
  try {
    // Get user role
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    // Build query based on user role
    let query = {};
    
    if (user.role === 'superadmin') {
      // Super admin can see all campaigns
      if (campaignId) {
        query.campaignId = campaignId;
      }
    } else {
      // Other users can only see their own campaigns
      query.userId = userId;
      if (campaignId) {
        query.campaignId = campaignId;
      }
    }
    
    // Add date range if provided
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    // Aggregate campaign data with message logs
    const reports = await Campaign.aggregate([
      { $match: query },
      {
        $lookup: {
          from: 'messagelogs',
          localField: 'campaignId',
          foreignField: 'campaignId',
          as: 'messages'
        }
      },
      {
        $project: {
          campaignId: 1,
          campaignTitle: 1,
          createdAt: 1,
          sent: { $size: { $filter: { input: '$messages', as: 'msg', cond: { $eq: ['$$msg.status', 'sent'] } } } },
          delivered: { $size: { $filter: { input: '$messages', as: 'msg', cond: { $eq: ['$$msg.status', 'delivered'] } } } },
          read: { $size: { $filter: { input: '$messages', as: 'msg', cond: { $eq: ['$$msg.status', 'read'] } } } },
          failed: { $size: { $filter: { input: '$messages', as: 'msg', cond: { $eq: ['$$msg.status', 'failed'] } } } }
        }
      }
    ]);
    
    return reports;
  } catch (error) {
    throw error;
  }
};

/**
 * Get credit history via API
 */
const getCreditHistory = async (userId, { startDate, endDate }) => {
  try {
    const query = { userId };
    
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const transactions = await CreditTransaction.find(query)
      .sort({ createdAt: -1 })
      .populate('fromUserId', 'username')
      .populate('toUserId', 'username')
      .populate('categoryId', 'name');
    
    return transactions;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  sendMessage,
  scanWhatsappNumber,
  getReports,
  getCreditHistory
}; 