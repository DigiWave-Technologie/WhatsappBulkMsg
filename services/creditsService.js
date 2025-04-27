const { Credit, CreditTransaction } = require('../models/Credit');
const { Category } = require('../models/Category');
const User = require('../models/User');
const mongoose = require('mongoose');

class CreditsService {
  /**
   * Handle credit transfer between users
   */
  async handleCreditTransfer(fromUserId, toUserId, categoryId, creditAmount, timeDuration = 'unlimited', expiryDate = null, expiryTime = null) {
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
      let finalExpiryDate = null;
      if (timeDuration !== 'unlimited') {
        if (timeDuration === 'custom' || timeDuration === 'specific_date') {
          if (!expiryDate || !expiryTime) {
            throw new Error('Expiry date and time are required for custom and specific date durations');
          }
          
          // Combine date and time
          const [hours, minutes] = expiryTime.split(':');
          finalExpiryDate = new Date(expiryDate);
          finalExpiryDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
          
          // Validate that the expiry date is in the future
          if (finalExpiryDate <= new Date()) {
            throw new Error('Expiry date must be in the future');
          }
        } else {
          const now = new Date();
          switch (timeDuration) {
            case 'daily':
              finalExpiryDate = new Date(now.setDate(now.getDate() + 1));
              break;
            case 'weekly':
              finalExpiryDate = new Date(now.setDate(now.getDate() + 7));
              break;
            case 'monthly':
              finalExpiryDate = new Date(now.setMonth(now.getMonth() + 1));
              break;
            case 'yearly':
              finalExpiryDate = new Date(now.setFullYear(now.getFullYear() + 1));
              break;
          }
        }
      }

      // Update or create destination user's credit
      await Credit.findOneAndUpdate(
        { userId: toUserId, categoryId: categoryId },
        { 
          $inc: { credit: creditAmount },
          $set: { 
            timeDuration: timeDuration,
            expiryDate: finalExpiryDate
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
        description: `Credit transfer from ${fromUser.username} to ${toUser.username} with ${timeDuration} duration${finalExpiryDate ? ` (expires: ${finalExpiryDate.toLocaleString()})` : ''}`
      });

      return { 
        success: true, 
        message: 'Credit transfer successful',
        expiryDate: finalExpiryDate ? finalExpiryDate.toLocaleString() : null
      };
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
  async getCreditUsageStats(userId) {
    try {
      const stats = await CreditTransaction.aggregate([
        {
          $match: {
            fromUserId: new mongoose.Types.ObjectId(userId)
          }
        },
        {
          $group: {
            _id: '$categoryId',
            totalUsed: { $sum: '$creditAmount' },
            count: { $sum: 1 }
          }
        },
        {
          $lookup: {
            from: 'categories',
            localField: '_id',
            foreignField: '_id',
            as: 'category'
          }
        },
        {
          $unwind: '$category'
        }
      ]);

      return stats;
    } catch (error) {
      throw new Error('Failed to get credit usage statistics');
    }
  }

  /**
   * Get user credit balance
   */
  async getUserCreditBalance(userId) {
    try {
      const credits = await Credit.find({ userId })
        .populate('categoryId', 'name creditCost')
        .lean();
      
      return credits;
    } catch (error) {
      throw new Error('Failed to get user credit balance');
    }
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
}

module.exports = new CreditsService();
