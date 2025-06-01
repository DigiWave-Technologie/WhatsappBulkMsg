const Campaign = require('../models/Campaign');
const MessageLog = require('../models/MessageLog');
const User = require('../models/User');
const { CreditTransaction } = require('../models/Credit');
const Template = require('../models/Template');
const Group = require('../models/Group');
const creditService = require('./creditsService');
const whatsappService = require('./whatsappService');

/**
 * Send a WhatsApp message via API
 */
const sendMessage = async (userId, messageData) => {
  try {
    const { recipient, message, template, media, variables } = messageData;
    
    // Check if user has sufficient credits
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    // If not super admin, check credits
    if (user.role !== 'super_admin') {
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
      if (userCredit < 1 && !user.hasUnlimitedCredits) {
        throw new Error('Insufficient credits');
      }
      
      // Deduct credit if not unlimited
      if (!user.hasUnlimitedCredits) {
        await creditService.decrementCreditByUserId(userId, 1);
      }
    }
    
    // Send message via WhatsApp service
    const result = await whatsappService.sendMessage({
      to: recipient,
      message,
      template,
      media,
      variables
    });
    
    // Log the message
    await MessageLog.create({
      userId,
      recipient,
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
 * Send a campaign via API
 */
const sendCampaign = async (userId, campaignData) => {
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
    } = campaignData;

    // Create campaign
    const campaign = await Campaign.create({
      title,
      type,
      recipients,
      message,
      template,
      media,
      variables,
      scheduleDate,
      delayBetweenMessages,
      userId,
      status: scheduleDate ? 'scheduled' : 'pending'
    });

    // If no schedule date, send immediately
    if (!scheduleDate) {
      // Send messages
      for (const recipient of recipients) {
        await sendMessage(userId, {
          recipient,
          message,
          template,
          media,
          variables
        });

        if (delayBetweenMessages) {
          await new Promise(resolve => setTimeout(resolve, delayBetweenMessages * 1000));
        }
      }

      campaign.status = 'completed';
      await campaign.save();
    }

    return campaign;
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
 * Create a template via API
 */
const createTemplate = async (userId, { name, content, category, language }) => {
  try {
    // Check if user has permission to create templates
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Create template
    const template = await Template.create({
      name,
      content,
      category,
      language,
      createdBy: userId,
      status: 'pending' // Templates need approval by default
    });

    return template;
  } catch (error) {
    throw error;
  }
};

/**
 * Create a group via API
 */
const createGroup = async (userId, { name, contacts }) => {
  try {
    // Check if user has permission to create groups
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Create group
    const group = await Group.create({
      name,
      contacts,
      createdBy: userId
    });

    return group;
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
  sendCampaign,
  scanWhatsappNumber,
  getReports,
  getCreditHistory,
  createTemplate,
  createGroup
}; 