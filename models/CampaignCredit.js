const mongoose = require('mongoose');

const campaignCreditSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    required: true
  },
  credit: {
    type: Number,
    default: 0
  },
  isUnlimited: {
    type: Boolean,
    default: false
  },
  timeDuration: {
    type: String,
    enum: ['unlimited', 'daily', 'weekly', 'monthly', 'yearly', 'custom', 'specific_date'],
    default: 'unlimited'
  },
  expiryDate: {
    type: Date
  },
  lastUsed: {
    type: Date
  },
  refundSettings: {
    enabled: {
      type: Boolean,
      default: false
    },
    refundPercentage: {
      type: Number,
      default: 10, // Default 10% refund
      min: 0,
      max: 100
    },
    refundThreshold: {
      type: Number,
      default: 0, // Minimum number of failed messages to trigger refund
      min: 0
    }
  }
}, { timestamps: true });

// Index for faster queries
campaignCreditSchema.index({ userId: 1, campaignId: 1 }, { unique: true });

const campaignCreditTransactionSchema = new mongoose.Schema({
  fromUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  toUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    required: true
  },
  creditType: {
    type: String,
    enum: ['credit', 'debit', 'expiry', 'bonus', 'transfer', 'refund'],
    required: true
  },
  credit: {
    type: Number,
    required: true
  },
  description: {
    type: String
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    failedMessages: {
      type: Number,
      default: 0
    },
    totalMessages: {
      type: Number,
      default: 0
    },
    refundPercentage: {
      type: Number,
      default: 0
    }
  }
}, { timestamps: true });

// Indexes for faster queries
campaignCreditTransactionSchema.index({ fromUserId: 1, createdAt: -1 });
campaignCreditTransactionSchema.index({ toUserId: 1, createdAt: -1 });
campaignCreditTransactionSchema.index({ campaignId: 1, createdAt: -1 });

const CampaignCredit = mongoose.model('CampaignCredit', campaignCreditSchema);
const CampaignCreditTransaction = mongoose.model('CampaignCreditTransaction', campaignCreditTransactionSchema);

module.exports = {
  CampaignCredit,
  CampaignCreditTransaction
}; 