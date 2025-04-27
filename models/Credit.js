const mongoose = require('mongoose');

const creditSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
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
  }
}, { timestamps: true });

// Index for faster queries
creditSchema.index({ userId: 1, categoryId: 1 }, { unique: true });

const creditTransactionSchema = new mongoose.Schema({
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
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  creditType: {
    type: String,
    enum: ['credit', 'debit', 'expiry', 'bonus', 'transfer'],
    required: true
  },
  credit: {
    type: Number,
    required: true
  },
  description: {
    type: String
  },
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
}, { timestamps: true });

// Index for faster queries
creditTransactionSchema.index({ fromUserId: 1, createdAt: -1 });
creditTransactionSchema.index({ toUserId: 1, createdAt: -1 });
creditTransactionSchema.index({ categoryId: 1, createdAt: -1 });

const Credit = mongoose.model('Credit', creditSchema);
const CreditTransaction = mongoose.model('CreditTransaction', creditTransactionSchema);

module.exports = {
  Credit,
  CreditTransaction
}; 