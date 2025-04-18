const { Credit, CreditTransaction } = require('../models/Credit');
const { Category } = require('../models/Category');
const User = require('../models/User');

class CreditsService {
  /**
   * Handle credit transfer between users
   */
  async handleCreditTransfer(fromUserId, toUserId, categoryId, amount) {
    const session = await Credit.startSession();
    session.startTransaction();

    try {
      // Get sender and receiver
      const [sender, receiver] = await Promise.all([
        User.findById(fromUserId),
        User.findById(toUserId)
      ]);

      if (!sender || !receiver) {
        throw new Error('Invalid sender or receiver');
      }

      // Check sender role permissions
      if (!['superadmin', 'admin', 'reseller'].includes(sender.role)) {
        throw new Error('Invalid sender role');
      }

      // Get sender's credit
      const senderCredit = await this.getSenderCredit(fromUserId, categoryId);
      if (!senderCredit || senderCredit.credit < amount) {
        throw new Error('Insufficient credits');
      }

      // Deduct credit from sender
      await this.deductCredit(fromUserId, categoryId, amount, session);

      // Add credit to receiver
      await this.addCredit(toUserId, categoryId, amount, session);

      // Log transaction
      await this.logTransaction({
        fromUserId,
        toUserId,
        categoryId,
        creditType: 'credit',
        credit: amount,
        description: `Credit transfer from ${sender.name} to ${receiver.name}`,
        session
      });

      await session.commitTransaction();
      return true;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
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
  async deductCredit(userId, categoryId, amount, session = null) {
    const credit = await Credit.findOne({ userId, categoryId });
    if (!credit) {
      throw new Error('Credit not found');
    }

    if (credit.credit < amount) {
      throw new Error('Insufficient credits');
    }

    credit.credit -= amount;
    credit.lastUsed = new Date();
    
    if (session) {
      await credit.save({ session });
    } else {
      await credit.save();
    }

    return credit;
  }

  /**
   * Add credit to user
   */
  async addCredit(userId, categoryId, amount, session = null) {
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

    if (session) {
      await credit.save({ session });
    } else {
      await credit.save();
    }

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
    metadata = {},
    session = null
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

    if (session) {
      await transaction.save({ session });
    } else {
      await transaction.save();
    }

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
  async getCreditsTransaction(filters = {}) {
    const query = {};
    
    if (filters.fromUserId) query.fromUserId = filters.fromUserId;
    if (filters.toUserId) query.toUserId = filters.toUserId;
    if (filters.categoryId) query.categoryId = filters.categoryId;
    if (filters.creditType) query.creditType = filters.creditType;
    
    if (filters.startDate && filters.endDate) {
      query.createdAt = {
        $gte: new Date(filters.startDate),
        $lte: new Date(filters.endDate)
      };
    }

    return await CreditTransaction.find(query)
      .populate('fromUserId', 'name email')
      .populate('toUserId', 'name email')
      .populate('categoryId', 'name')
      .sort({ createdAt: -1 })
      .lean();
  }

  /**
   * Get credit transactions for a user
   */
  async getCreditsTransactionByUserId(userId, filters = {}) {
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

    return await CreditTransaction.find(query)
      .populate('fromUserId', 'name email')
      .populate('toUserId', 'name email')
      .populate('categoryId', 'name')
      .sort({ createdAt: -1 })
      .lean();
  }

  /**
   * Get credit transactions for a user and category
   */
  async getCreditsTransactionByUserIdCategoryId(userId, categoryId, filters = {}) {
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

    return await CreditTransaction.find(query)
      .populate('fromUserId', 'name email')
      .populate('toUserId', 'name email')
      .populate('categoryId', 'name')
      .sort({ createdAt: -1 })
      .lean();
  }

  /**
   * Get credit usage statistics
   */
  async getCreditUsageStats(filters = {}) {
    const query = {};
    
    if (filters.userId) query.toUserId = filters.userId;
    if (filters.categoryId) query.categoryId = filters.categoryId;
    
    if (filters.startDate && filters.endDate) {
      query.createdAt = {
        $gte: new Date(filters.startDate),
        $lte: new Date(filters.endDate)
      };
    }

    const stats = await CreditTransaction.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            categoryId: '$categoryId',
            creditType: '$creditType'
          },
          totalCredits: { $sum: '$credit' },
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id.categoryId',
          foreignField: '_id',
          as: 'category'
        }
      },
      { $unwind: '$category' },
      {
        $project: {
          _id: 0,
          categoryId: '$_id.categoryId',
          categoryName: '$category.name',
          creditType: '$_id.creditType',
          totalCredits: 1,
          count: 1
        }
      }
    ]);

    return stats;
  }

  /**
   * Get user credit balance
   */
  async getUserCreditBalance(userId, categoryId = null) {
    const query = { userId };
    if (categoryId) query.categoryId = categoryId;

    const credits = await Credit.find(query)
      .populate('categoryId', 'name creditCost')
      .lean();

    return credits;
  }

  /**
   * Check and handle credit expiry
   */
  async handleCreditExpiry() {
    const expiredCredits = await Credit.find({
      expiryDate: { $lt: new Date() },
      credit: { $gt: 0 }
    });

    for (const credit of expiredCredits) {
      const session = await Credit.startSession();
      session.startTransaction();

      try {
        // Log expiry transaction
        await this.logTransaction({
          fromUserId: credit.userId,
          toUserId: credit.userId,
          categoryId: credit.categoryId,
          creditType: 'expiry',
          credit: credit.credit,
          description: 'Credits expired',
          session
        });

        // Set credit to 0
        credit.credit = 0;
        await credit.save({ session });

        await session.commitTransaction();
      } catch (error) {
        await session.abortTransaction();
        console.error('Error handling credit expiry:', error);
      } finally {
        session.endSession();
      }
    }
  }
}

module.exports = new CreditsService();
