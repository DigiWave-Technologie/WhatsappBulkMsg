const { CampaignCredit, CampaignCreditTransaction } = require('../models/CampaignCredit');
const User = require('../models/User');
const Campaign = require('../models/Campaign');
const mongoose = require('mongoose');

class CampaignCreditService {
  /**
   * Transfer credits between users based on roles
   */
  async transferCredits(fromUserId, toUserId, campaignId, amount, timeDuration = 'unlimited') {
    try {
      // Get users and their roles
      const [fromUser, toUser] = await Promise.all([
        User.findById(fromUserId),
        User.findById(toUserId)
      ]);

      if (!fromUser || !toUser) {
        throw new Error('One or both users not found');
      }

      // Check if campaign exists
      const campaign = await Campaign.findById(campaignId);
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      // Role-based validation
      if (!this.canTransferCredits(fromUser.role, toUser.role)) {
        throw new Error('Credit transfer not allowed between these roles');
      }

      // Super Admin has unlimited credits
      if (fromUser.role !== 'super_admin') {
        const sourceCredit = await CampaignCredit.findOne({
          userId: fromUserId,
          campaignId: campaignId
        });

        if (!sourceCredit || sourceCredit.credit < amount) {
          throw new Error('Insufficient credits');
        }

        // Update source user's credit
        await CampaignCredit.findOneAndUpdate(
          { userId: fromUserId, campaignId: campaignId },
          { $inc: { credit: -amount } }
        );
      }

      // Calculate expiry date based on time duration
      let expiryDate = null;
      if (timeDuration !== 'unlimited') {
        const now = new Date();
        switch (timeDuration) {
          case 'daily':
            expiryDate = new Date(now.setDate(now.getDate() + 1));
            break;
          case 'weekly':
            expiryDate = new Date(now.setDate(now.getDate() + 7));
            break;
          case 'monthly':
            expiryDate = new Date(now.setMonth(now.getMonth() + 1));
            break;
          case 'yearly':
            expiryDate = new Date(now.setFullYear(now.getFullYear() + 1));
            break;
        }
      }

      // Update or create destination user's credit
      await CampaignCredit.findOneAndUpdate(
        { userId: toUserId, campaignId: campaignId },
        { 
          $inc: { credit: amount },
          $set: { 
            timeDuration: timeDuration,
            expiryDate: expiryDate
          }
        },
        { upsert: true }
      );

      // Create transaction record
      await CampaignCreditTransaction.create({
        fromUserId,
        toUserId,
        campaignId,
        credit: amount,
        creditType: 'transfer',
        description: `Credit transfer from ${fromUser.username} to ${toUser.username} for campaign ${campaign.name}`
      });

      return { success: true, message: 'Credit transfer successful' };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check if credit transfer is allowed between roles
   */
  canTransferCredits(fromRole, toRole) {
    const transferMatrix = {
      'super_admin': ['admin', 'reseller', 'user'],
      'admin': ['reseller', 'user'],
      'reseller': ['user'],
      'user': [] // Users cannot transfer credits
    };

    return transferMatrix[fromRole]?.includes(toRole) || false;
  }

  /**
   * Get user's campaign credits
   */
  async getUserCampaignCredits(userId) {
    const credits = await CampaignCredit.find({ userId })
      .populate('campaignId', 'name type')
      .lean();
    
    return credits;
  }

  /**
   * Debit credits for campaign usage
   */
  async debitCredits(userId, campaignId, amount) {
    try {
      const user = await User.findById(userId);
      if (!user) throw new Error('User not found');

      // Super Admin has unlimited credits
      if (user.role === 'super_admin') {
        return { success: true, message: 'Super Admin has unlimited credits' };
      }

      const credit = await CampaignCredit.findOne({
        userId,
        campaignId
      });

      if (!credit || (credit.credit < amount && !credit.isUnlimited)) {
        throw new Error('Insufficient credits for this campaign');
      }

      if (!credit.isUnlimited) {
        credit.credit -= amount;
        credit.lastUsed = new Date();
        await credit.save();
      }

      // Create transaction record
      await CampaignCreditTransaction.create({
        fromUserId: userId,
        toUserId: userId,
        campaignId,
        creditType: 'debit',
        credit: amount,
        description: 'Credit deduction for campaign usage'
      });

      return { success: true, message: 'Credits debited successfully' };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get credit transactions for a user and campaign
   */
  async getCampaignCreditTransactions(userId, campaignId, filters = {}) {
    try {
      const query = {
        $or: [{ fromUserId: userId }, { toUserId: userId }],
        campaignId
      };
      
      if (filters.creditType) query.creditType = filters.creditType;
      
      if (filters.startDate && filters.endDate) {
        query.createdAt = {
          $gte: new Date(filters.startDate),
          $lte: new Date(filters.endDate)
        };
      }

      const transactions = await CampaignCreditTransaction.find(query)
        .populate('fromUserId', 'username')
        .populate('toUserId', 'username')
        .populate('campaignId', 'name')
        .sort({ createdAt: -1 })
        .lean();
      
      return transactions;
    } catch (error) {
      throw new Error('Failed to get campaign credit transactions');
    }
  }

  /**
   * Handle credit expiry
   */
  async handleCreditExpiry() {
    try {
      const now = new Date();
      
      // Find all credits with expiry dates that have passed
      const expiredCredits = await CampaignCredit.find({
        expiryDate: { $lt: now },
        timeDuration: { $ne: 'unlimited' }
      });
      
      for (const credit of expiredCredits) {
        // Create transaction record for expired credits
        await CampaignCreditTransaction.create({
          fromUserId: credit.userId,
          toUserId: credit.userId,
          campaignId: credit.campaignId,
          credit: credit.credit,
          creditType: 'expiry',
          description: `Credits expired due to ${credit.timeDuration} duration`
        });
        
        // Reset credit to 0
        credit.credit = 0;
        credit.expiryDate = null;
        credit.timeDuration = 'unlimited';
        await credit.save();
      }
      
      return { success: true, message: `Processed ${expiredCredits.length} expired credits` };
    } catch (error) {
      throw new Error(`Failed to handle credit expiry: ${error.message}`);
    }
  }

  /**
   * Process refund for failed messages
   */
  async processRefund(userId, campaignId, failedMessages, totalMessages) {
    try {
      const credit = await CampaignCredit.findOne({
        userId,
        campaignId
      });

      if (!credit || !credit.refundSettings.enabled) {
        return { success: false, message: 'Refund not enabled for this campaign' };
      }

      // Check if failed messages meet the threshold
      if (failedMessages < credit.refundSettings.refundThreshold) {
        return { success: false, message: 'Failed messages below refund threshold' };
      }

      // Calculate refund amount
      const refundPercentage = credit.refundSettings.refundPercentage;
      const refundAmount = Math.floor((failedMessages / totalMessages) * refundPercentage);

      if (refundAmount <= 0) {
        return { success: false, message: 'No refund amount calculated' };
      }

      // Update user's credit
      await CampaignCredit.findOneAndUpdate(
        { userId, campaignId },
        { $inc: { credit: refundAmount } }
      );

      // Create refund transaction record
      await CampaignCreditTransaction.create({
        fromUserId: userId,
        toUserId: userId,
        campaignId,
        credit: refundAmount,
        creditType: 'refund',
        description: `Refund for ${failedMessages} failed messages out of ${totalMessages} total messages`,
        metadata: {
          failedMessages,
          totalMessages,
          refundPercentage
        }
      });

      return {
        success: true,
        message: 'Refund processed successfully',
        refundAmount,
        failedMessages,
        totalMessages
      };
    } catch (error) {
      throw new Error(`Failed to process refund: ${error.message}`);
    }
  }

  /**
   * Update refund settings for a campaign
   */
  async updateRefundSettings(userId, campaignId, settings) {
    try {
      const credit = await CampaignCredit.findOne({
        userId,
        campaignId
      });

      if (!credit) {
        throw new Error('Campaign credit not found');
      }

      // Update refund settings
      credit.refundSettings = {
        ...credit.refundSettings,
        ...settings
      };

      await credit.save();

      return {
        success: true,
        message: 'Refund settings updated successfully',
        settings: credit.refundSettings
      };
    } catch (error) {
      throw new Error(`Failed to update refund settings: ${error.message}`);
    }
  }

  /**
   * Get refund statistics for a campaign
   */
  async getRefundStats(userId, campaignId) {
    try {
      const transactions = await CampaignCreditTransaction.find({
        campaignId,
        creditType: 'refund'
      }).sort({ createdAt: -1 });

      const totalRefunds = transactions.reduce((sum, t) => sum + t.credit, 0);
      const totalFailedMessages = transactions.reduce((sum, t) => sum + (t.metadata?.failedMessages || 0), 0);
      const totalMessages = transactions.reduce((sum, t) => sum + (t.metadata?.totalMessages || 0), 0);

      return {
        success: true,
        data: {
          totalRefunds,
          totalFailedMessages,
          totalMessages,
          refundTransactions: transactions
        }
      };
    } catch (error) {
      throw new Error(`Failed to get refund statistics: ${error.message}`);
    }
  }
}

module.exports = new CampaignCreditService(); 