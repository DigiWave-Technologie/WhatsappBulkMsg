const { Credit, CreditTransaction } = require('../models/Credit');
const User = require('../models/User');
const Campaign = require('../models/Campaign');
const { format } = require('date-fns');

class ReportService {
  /**
   * Get system-wide statistics (Super Admin only)
   */
  async getSystemStats(filters = {}) {
    const query = {};
    
    if (filters.startDate && filters.endDate) {
      query.createdAt = {
        $gte: new Date(filters.startDate),
        $lte: new Date(filters.endDate)
      };
    }

    const [
      totalUsers,
      activeUsers,
      totalMessages,
      totalCredits,
      creditTransactions
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: 'active' }),
      Campaign.aggregate([
        { $match: query },
        { $group: { _id: null, total: { $sum: '$totalMessages' } } }
      ]),
      Credit.aggregate([
        { $group: { _id: null, total: { $sum: '$credit' } } }
      ]),
      CreditTransaction.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$creditType',
            total: { $sum: '$credit' },
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    return {
      totalUsers,
      activeUsers,
      totalMessages: totalMessages[0]?.total || 0,
      totalCredits: totalCredits[0]?.total || 0,
      creditTransactions: creditTransactions.reduce((acc, curr) => {
        acc[curr._id] = { total: curr.total, count: curr.count };
        return acc;
      }, {})
    };
  }

  /**
   * Get admin-level statistics
   */
  async getAdminStats(adminId, filters = {}) {
    const query = { parentUserId: adminId };
    
    if (filters.startDate && filters.endDate) {
      query.createdAt = {
        $gte: new Date(filters.startDate),
        $lte: new Date(filters.endDate)
      };
    }

    const [
      resellers,
      users,
      campaigns,
      creditTransactions
    ] = await Promise.all([
      User.find({ parentUserId: adminId, role: 'reseller' })
        .select('_id name email status')
        .lean(),
      User.find({ parentUserId: { $in: resellers.map(r => r._id) } })
        .select('_id name email status parentUserId')
        .lean(),
      Campaign.find(query)
        .populate('userId', 'name email')
        .lean(),
      CreditTransaction.find({
        ...query,
        $or: [
          { fromUserId: { $in: [...resellers.map(r => r._id), ...users.map(u => u._id)] } },
          { toUserId: { $in: [...resellers.map(r => r._id), ...users.map(u => u._id)] } }
        ]
      })
        .populate('fromUserId', 'name email')
        .populate('toUserId', 'name email')
        .populate('categoryId', 'name')
        .lean()
    ]);

    return {
      resellers: resellers.map(reseller => ({
        ...reseller,
        users: users.filter(u => u.parentUserId.toString() === reseller._id.toString()),
        campaigns: campaigns.filter(c => c.userId.parentUserId === reseller._id),
        transactions: creditTransactions.filter(t => 
          t.fromUserId._id.toString() === reseller._id.toString() || 
          t.toUserId._id.toString() === reseller._id.toString()
        )
      }))
    };
  }

  /**
   * Get reseller-level statistics
   */
  async getResellerStats(resellerId, filters = {}) {
    const query = { parentUserId: resellerId };
    
    if (filters.startDate && filters.endDate) {
      query.createdAt = {
        $gte: new Date(filters.startDate),
        $lte: new Date(filters.endDate)
      };
    }

    const [
      users,
      campaigns,
      creditTransactions
    ] = await Promise.all([
      User.find({ parentUserId: resellerId })
        .select('_id name email status')
        .lean(),
      Campaign.find(query)
        .populate('userId', 'name email')
        .lean(),
      CreditTransaction.find({
        ...query,
        $or: [
          { fromUserId: { $in: users.map(u => u._id) } },
          { toUserId: { $in: users.map(u => u._id) } }
        ]
      })
        .populate('fromUserId', 'name email')
        .populate('toUserId', 'name email')
        .populate('categoryId', 'name')
        .lean()
    ]);

    return {
      users: users.map(user => ({
        ...user,
        campaigns: campaigns.filter(c => c.userId._id.toString() === user._id.toString()),
        transactions: creditTransactions.filter(t => 
          t.fromUserId._id.toString() === user._id.toString() || 
          t.toUserId._id.toString() === user._id.toString()
        )
      }))
    };
  }

  /**
   * Get user-level statistics
   */
  async getUserStats(userId, filters = {}) {
    const query = { userId };
    
    if (filters.startDate && filters.endDate) {
      query.createdAt = {
        $gte: new Date(filters.startDate),
        $lte: new Date(filters.endDate)
      };
    }

    const [
      campaigns,
      creditTransactions,
      credits
    ] = await Promise.all([
      Campaign.find(query)
        .populate('categoryId', 'name')
        .lean(),
      CreditTransaction.find({
        ...query,
        $or: [{ fromUserId: userId }, { toUserId: userId }]
      })
        .populate('fromUserId', 'name email')
        .populate('toUserId', 'name email')
        .populate('categoryId', 'name')
        .lean(),
      Credit.find({ userId })
        .populate('categoryId', 'name creditCost')
        .lean()
    ]);

    return {
      campaigns,
      transactions: creditTransactions,
      credits
    };
  }

  /**
   * Get campaign report
   */
  async getCampaignReport(campaignId) {
    const campaign = await Campaign.findById(campaignId)
      .populate('userId', 'name email')
      .populate('categoryId', 'name')
      .lean();

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    const transactions = await CreditTransaction.find({
      campaignId,
      creditType: 'debit'
    })
      .populate('fromUserId', 'name email')
      .populate('categoryId', 'name')
      .lean();

    return {
      campaign,
      transactions,
      summary: {
        totalMessages: campaign.totalMessages,
        totalCredits: transactions.reduce((sum, t) => sum + t.credit, 0),
        status: campaign.status,
        createdAt: campaign.createdAt,
        updatedAt: campaign.updatedAt
      }
    };
  }

  /**
   * Export report to CSV
   */
  async exportReport(data, type) {
    const headers = {
      system: ['Metric', 'Value'],
      admin: ['Reseller', 'Users', 'Campaigns', 'Total Credits', 'Active Users'],
      reseller: ['User', 'Campaigns', 'Total Credits', 'Active Status'],
      user: ['Campaign', 'Status', 'Messages', 'Credits', 'Date'],
      campaign: ['Message ID', 'Status', 'Credits', 'Timestamp']
    };

    const rows = this.formatReportData(data, type);
    
    return {
      headers: headers[type],
      rows
    };
  }

  /**
   * Format report data for CSV export
   */
  formatReportData(data, type) {
    switch (type) {
      case 'system':
        return Object.entries(data).map(([key, value]) => [key, value]);
      
      case 'admin':
        return data.resellers.map(reseller => [
          reseller.name,
          reseller.users.length,
          reseller.campaigns.length,
          reseller.transactions.reduce((sum, t) => sum + t.credit, 0),
          reseller.users.filter(u => u.status === 'active').length
        ]);
      
      case 'reseller':
        return data.users.map(user => [
          user.name,
          user.campaigns.length,
          user.transactions.reduce((sum, t) => sum + t.credit, 0),
          user.status
        ]);
      
      case 'user':
        return data.campaigns.map(campaign => [
          campaign.title,
          campaign.status,
          campaign.totalMessages,
          data.transactions.find(t => t.campaignId?.toString() === campaign._id.toString())?.credit || 0,
          format(new Date(campaign.createdAt), 'yyyy-MM-dd HH:mm:ss')
        ]);
      
      case 'campaign':
        return data.transactions.map(transaction => [
          transaction.metadata?.messageId || 'N/A',
          transaction.metadata?.status || 'N/A',
          transaction.credit,
          format(new Date(transaction.createdAt), 'yyyy-MM-dd HH:mm:ss')
        ]);
      
      default:
        return [];
    }
  }
}

module.exports = new ReportService(); 