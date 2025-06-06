const { Credit, CreditTransaction } = require('../models/Credit');
const { Category } = require('../models/Category');
const User = require('../models/User');
const mongoose = require('mongoose');

class CreditService {
  /**
   * Handle credit transfer between users
   */
  async handleCreditTransfer(fromUserId, toUserId, categoryId, creditAmount, timeDuration = 'unlimited') {
    try {
      // For super admin, skip credit check
      const fromUser = await User.findById(fromUserId);
      if (!fromUser) {
        throw new Error('Source user not found');
      }

      const toUser = await User.findById(toUserId);
      if (!toUser) {
        throw new Error('Destination user not found');
      }

      // If the source user is not a super admin, check their credit balance
      if (fromUser.role !== 'super_admin') {
        const sourceCredit = await Credit.findOne({
          userId: fromUserId,
          categoryId: categoryId
        });

        if (!sourceCredit || sourceCredit.credit < creditAmount) {
          throw new Error('Insufficient credits');
        }

        // Update source user's credit
        await Credit.findOneAndUpdate(
          { userId: fromUserId, categoryId: categoryId },
          { $inc: { credit: -creditAmount } }
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
      await Credit.findOneAndUpdate(
        { userId: toUserId, categoryId: categoryId },
        { 
          $inc: { credit: creditAmount },
          $set: { 
            timeDuration: timeDuration,
            expiryDate: expiryDate
          }
        },
        { upsert: true }
      );

      // Create transaction record
      await CreditTransaction.create({
        fromUserId,
        toUserId,
        categoryId,
        credit: creditAmount,
        creditType: 'transfer',
        description: `Credit transfer from ${fromUser.username} to ${toUser.username} with ${timeDuration} duration`
      });

      return { success: true, message: 'Credit transfer successful' };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get sender's credit for a category
   */
  async getSenderCredit(userId, categoryId) {
    return await Credit.findOne({ userId, categoryId });
  }

  /**
   * Deduct credit from user
   */
  async deductCredit(userId, categoryId, amount) {
    const credit = await Credit.findOne({ userId, categoryId });
    if (!credit) {
      throw new Error('Credit not found');
    }

    if (credit.credit < amount) {
      throw new Error('Insufficient credits');
    }

    credit.credit -= amount;
    credit.lastUsed = new Date();
    await credit.save();

    return credit;
  }

  /**
   * Add credit to user
   */
  async addCredit(userId, categoryId, amount) {
    let credit = await Credit.findOne({ userId, categoryId });
    
    if (!credit) {
      credit = new Credit({
        userId,
        categoryId,
        credit: amount
      });
    } else {
      credit.credit += amount;
    }

    await credit.save();
    return credit;
  }

  /**
   * Log credit transaction
   */
  async logTransaction({
    fromUserId,
    toUserId,
    categoryId,
    creditType,
    credit,
    description,
    campaignId = null,
    metadata = {}
  }) {
    const transaction = new CreditTransaction({
      fromUserId,
      toUserId,
      categoryId,
      creditType,
      credit,
      description,
      campaignId,
      metadata
    });

    await transaction.save();
    return transaction;
  }

  /**
   * Get user credits by user ID
   */
  async getUserCreditsByUserId(userId) {
    const credits = await Credit.find({ userId })
      .populate('categoryId', 'name creditCost')
      .lean();
    
    return credits;
  }

  /**
   * Get credit transactions with filters
   */
  async getCreditsTransaction(userId = null) {
    try {
      const query = userId ? { $or: [{ fromUserId: userId }, { toUserId: userId }] } : {};
      const transactions = await CreditTransaction.find(query)
        .populate('fromUserId', 'username')
        .populate('toUserId', 'username')
        .populate('categoryId', 'name')
        .sort({ createdAt: -1 })
        .lean();
      
      return transactions;
    } catch (error) {
      throw new Error('Failed to get credit transactions');
    }
  }

  /**
   * Get credit transactions for a user
   */
  async getCreditsTransactionByUserId(userId, filters = {}) {
    try {
      const query = {
        $or: [{ fromUserId: userId }, { toUserId: userId }]
      };
      
      if (filters.categoryId) query.categoryId = filters.categoryId;
      if (filters.creditType) query.creditType = filters.creditType;
      
      if (filters.startDate && filters.endDate) {
        query.createdAt = {
          $gte: new Date(filters.startDate),
          $lte: new Date(filters.endDate)
        };
      }

      const transactions = await CreditTransaction.find(query)
        .populate('fromUserId', 'username')
        .populate('toUserId', 'username')
        .populate('categoryId', 'name')
        .sort({ createdAt: -1 })
        .lean();
      
      return transactions;
    } catch (error) {
      throw new Error('Failed to get user credit transactions');
    }
  }

  /**
   * Get credit transactions for a user and category
   */
  async getCreditsTransactionByUserIdCategoryId(userId, categoryId, filters = {}) {
    try {
      const query = {
        $or: [{ fromUserId: userId }, { toUserId: userId }],
        categoryId
      };
      
      if (filters.creditType) query.creditType = filters.creditType;
      
      if (filters.startDate && filters.endDate) {
        query.createdAt = {
          $gte: new Date(filters.startDate),
          $lte: new Date(filters.endDate)
        };
      }

      const transactions = await CreditTransaction.find(query)
        .populate('fromUserId', 'username')
        .populate('toUserId', 'username')
        .populate('categoryId', 'name')
        .sort({ createdAt: -1 })
        .lean();
      
      return transactions;
    } catch (error) {
      throw new Error('Failed to get category credit transactions');
    }
  }

  /**
   * Get credit usage statistics
   */
  async getCreditUsageStats(userId, filters = {}) {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const stats = {
      totalCredits: 0,
      usedCredits: 0,
      availableCredits: 0,
      transactions: [],
      dailyUsage: [],
      monthlyUsage: []
    };

    // Get all credits for the user
    const credits = await Credit.find({ userId });
    stats.totalCredits = credits.reduce((sum, credit) => sum + credit.credit, 0);

    // Get all debit transactions
    const debitTransactions = await CreditTransaction.find({
      fromUserId: userId,
      creditType: 'debit',
      ...filters
    });

    stats.usedCredits = debitTransactions.reduce((sum, t) => sum + t.credit, 0);
    stats.availableCredits = stats.totalCredits - stats.usedCredits;

    // Get daily usage
    const dailyUsage = await CreditTransaction.aggregate([
      {
        $match: {
          fromUserId: new mongoose.Types.ObjectId(userId.toString()),
          creditType: 'debit',
          ...filters
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          total: { $sum: '$credit' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    stats.dailyUsage = dailyUsage;

    // Get monthly usage
    const monthlyUsage = await CreditTransaction.aggregate([
      {
        $match: {
          fromUserId: new mongoose.Types.ObjectId(userId.toString()),
          creditType: 'debit',
          ...filters
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          total: { $sum: '$credit' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    stats.monthlyUsage = monthlyUsage;

    return stats;
  }

  /**
   * Get user credit balance
   */
  async getUserCreditBalance(userId) {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const credits = await Credit.find({ userId });
    
    // If user is Super Admin, return unlimited credits
    if (user.role === 'super_admin') {
      return credits.map(credit => ({
        ...credit.toObject(),
        isUnlimited: true,
        credit: Number.MAX_SAFE_INTEGER
      }));
    }

    return credits;
  }

  /**
   * Handle credit expiry
   */
  async handleCreditExpiry() {
    try {
      const now = new Date();
      
      // Find all credits with expiry dates that have passed
      const expiredCredits = await Credit.find({
        expiryDate: { $lt: now },
        timeDuration: { $ne: 'unlimited' }
      });
      
      for (const credit of expiredCredits) {
        // Create transaction record for expired credits
        await CreditTransaction.create({
          fromUserId: credit.userId,
          toUserId: credit.userId, // Same user for expiry
          categoryId: credit.categoryId,
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
   * Handle debit operation
   */
  async handleDebit(fromUserId, toUserId, categoryId, amount) {
    try {
      // Get sender and receiver
      const [sender, receiver] = await Promise.all([
        User.findById(fromUserId),
        User.findById(toUserId)
      ]);

      if (!sender || !receiver) {
        throw new Error('Invalid sender or receiver');
      }

      // Get sender's credit
      const senderCredit = await this.getSenderCredit(fromUserId, categoryId);
      if (!senderCredit || senderCredit.credit < amount) {
        throw new Error('Insufficient credits');
      }

      // Deduct credit from sender
      await this.deductCredit(fromUserId, categoryId, amount);

      // Log transaction
      await this.logTransaction({
        fromUserId,
        toUserId,
        categoryId,
        creditType: 'debit',
        credit: amount,
        description: `Credit debit from ${sender.username} to ${receiver.username}`
      });

      return true;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Decrement credit by user ID
   */
  async decrementCreditByUserId(userId, amount) {
    try {
      // Get user's credits
      const credits = await Credit.find({ userId });
      
      if (!credits.length) {
        throw new Error('No credits found for user');
      }

      // Try to deduct from each credit category
      for (const credit of credits) {
        if (credit.credit >= amount) {
          await this.deductCredit(userId, credit.categoryId, amount);
          
          // Log transaction
          await this.logTransaction({
            fromUserId: userId,
            toUserId: userId,
            categoryId: credit.categoryId,
            creditType: 'debit',
            credit: amount,
            description: 'Credit debit'
          });

          return true;
        }
      }

      throw new Error('Insufficient credits across all categories');
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get user categories
   */
  async getUserCategory(userId) {
    const credits = await Credit.find({ userId })
      .populate('categoryId', 'name creditCost')
      .lean();
    
    return credits.map(credit => credit.categoryId);
  }

  async decrementCreditByUser(userId, categoryId, amount) {
    try {
      const credit = await Credit.findOne({
        userId,
        categoryId
      });

      if (!credit || credit.credit < amount) {
        throw new Error('Insufficient credits');
      }

      await Credit.findOneAndUpdate(
        { userId, categoryId },
        { $inc: { credit: -amount } }
      );

      await CreditTransaction.create({
        fromUserId: userId,
        toUserId: null,
        categoryId,
        creditAmount: amount,
        creditType: 'debit',
        description: 'Credit debit for service usage'
      });

      return { success: true, message: 'Credit decremented successfully' };
    } catch (error) {
      throw error;
    }
  }

  // Transfer credits between users with role validation
  async transferCredits(fromUserId, toUserId, categoryId, amount, description = '') {
    try {
      const [fromUser, toUser] = await Promise.all([
        User.findById(fromUserId),
        User.findById(toUserId)
      ]);

      if (!fromUser || !toUser) {
        throw new Error('One or both users not found');
      }

      // Role-based validation
      if (!this.canTransferCredits(fromUser.role, toUser.role)) {
        throw new Error('Credit transfer not allowed between these roles');
      }

      // Super Admin has unlimited credits
      const needsCreditsCheck = fromUser.role !== 'super_admin';

      // Check if fromUser has sufficient credits (skip for super admin)
      let fromUserCredit;
      if (needsCreditsCheck) {
        fromUserCredit = await Credit.findOne({
          userId: fromUserId,
          categoryId
        });

        if (!fromUserCredit || (fromUserCredit.credit < amount && !fromUserCredit.isUnlimited)) {
          throw new Error('Insufficient credits');
        }

        // Update credits
        if (!fromUserCredit.isUnlimited) {
          fromUserCredit.credit -= amount;
          await fromUserCredit.save();
        }
      }

      let toUserCredit = await Credit.findOne({
        userId: toUserId,
        categoryId
      });

      if (!toUserCredit) {
        toUserCredit = new Credit({
          userId: toUserId,
          categoryId,
          credit: amount
        });
      } else {
        toUserCredit.credit += amount;
      }

      await toUserCredit.save();

      // Create transaction record
      const transaction = new CreditTransaction({
        fromUserId,
        toUserId,
        categoryId,
        creditType: 'transfer',
        credit: amount,
        description
      });

      await transaction.save();
      return transaction;
    } catch (error) {
      throw error;
    }
  }

  // Debit credits from user
  async debitCredits(userId, categoryId, amount, campaignId = null) {
    try {
      const user = await User.findById(userId);
      if (!user) throw new Error('User not found');

      // Super Admin has unlimited credits
      if (user.role === 'super_admin') {
        return { success: true, message: 'Super Admin has unlimited credits' };
      }

      const credit = await Credit.findOne({
        userId,
        categoryId
      });

      if (!credit || (credit.credit < amount && !credit.isUnlimited)) {
        throw new Error('Insufficient credits');
      }

      if (!credit.isUnlimited) {
        credit.credit -= amount;
        await credit.save();
      }

      // Create transaction record
      const transaction = new CreditTransaction({
        fromUserId: userId,
        toUserId: userId, // Self debit
        categoryId,
        creditType: 'debit',
        credit: amount,
        campaignId,
        description: 'Credit deduction for campaign'
      });

      await transaction.save();
      return transaction;
    } catch (error) {
      throw error;
    }
  }

  // Get credit transactions with role-based filtering
  async getCreditTransactions(userId, filters = {}) {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const query = {};

    // Role-based filtering
    switch (user.role) {
      case 'super_admin':
        // Can see all transactions
        break;
      case 'admin':
        // Can see transactions of their resellers and users
        const resellerIds = await User.find({ parentId: userId }).select('_id');
        query.$or = [
          { fromUserId: userId },
          { toUserId: userId },
          { fromUserId: { $in: resellerIds } },
          { toUserId: { $in: resellerIds } }
        ];
        break;
      case 'reseller':
        // Can see transactions of their users
        const userIds = await User.find({ parentId: userId }).select('_id');
        query.$or = [
          { fromUserId: userId },
          { toUserId: userId },
          { fromUserId: { $in: userIds } },
          { toUserId: { $in: userIds } }
        ];
        break;
      default:
        // Users can only see their own transactions
        query.$or = [
          { fromUserId: userId },
          { toUserId: userId }
        ];
    }

    // Apply additional filters
    if (filters.startDate) {
      query.createdAt = { $gte: new Date(filters.startDate) };
    }
    if (filters.endDate) {
      query.createdAt = { ...query.createdAt, $lte: new Date(filters.endDate) };
    }
    if (filters.creditType) {
      query.creditType = filters.creditType;
    }

    return CreditTransaction.find(query)
      .populate('fromUserId', 'username email')
      .populate('toUserId', 'username email')
      .populate('categoryId', 'name')
      .sort({ createdAt: -1 });
  }

  // Helper method to check if credit transfer is allowed between roles
  canTransferCredits(fromRole, toRole) {
    const transferMatrix = {
      'super_admin': ['admin', 'reseller', 'user'],
      'admin': ['reseller', 'user'],
      'reseller': ['user'],
      'user': []
    };

    return transferMatrix[fromRole]?.includes(toRole) || false;
  }

  /**
   * Get credit balance for all campaign types
   */
  async getCampaignTypeCreditBalance(userId) {
    try {
      const campaignTypes = [
        'VIRTUAL_QUICK',
        'VIRTUAL_BUTTON',
        'VIRTUAL_DP',
        'PERSONAL_QUICK',
        'PERSONAL_BUTTON',
        'PERSONAL_POLL',
        'INTERNATIONAL_PERSONAL_QUICK',
        'INTERNATIONAL_PERSONAL_BUTTON',
        'INTERNATIONAL_PERSONAL_POLL',
        'INTERNATIONAL_VIRTUAL_QUICK',
        'INTERNATIONAL_VIRTUAL_BUTTON'
      ];

      const balancePromises = campaignTypes.map(async (type) => {
        // Get all transactions for this campaign type
        const transactions = await CreditTransaction.find({
          fromUserId: userId,
          'metadata.campaignType': type
        });

        // Calculate total credits used
        const totalUsed = transactions.reduce((sum, t) => sum + t.credit, 0);

        // Get current credit balance
        const credit = await Credit.findOne({
          userId,
          'metadata.campaignType': type
        });

        return {
          campaignType: type,
          totalUsed,
          currentBalance: credit ? credit.credit : 0,
          lastTransaction: transactions.length > 0 ? transactions[transactions.length - 1].createdAt : null
        };
      });

      const balances = await Promise.all(balancePromises);

      // Calculate total balance across all campaign types
      const totalBalance = balances.reduce((sum, b) => sum + b.currentBalance, 0);
      const totalUsed = balances.reduce((sum, b) => sum + b.totalUsed, 0);

      return {
        campaignBalances: balances,
        totalBalance,
        totalUsed
      };
    } catch (error) {
      throw new Error(`Error getting campaign type credit balance: ${error.message}`);
    }
  }
}

module.exports = new CreditService();
