const mongoose = require('mongoose');

const messageLogSchema = new mongoose.Schema({
  messageId: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign'
  },
  recipient: {
    type: String,
    required: true
  },
  messageType: {
    type: String,
    enum: ['text', 'template', 'media'],
    required: true
  },
  content: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'read', 'failed'],
    default: 'pending'
  },
  error: {
    type: String
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
messageLogSchema.index({ userId: 1, createdAt: -1 });
messageLogSchema.index({ messageId: 1 });
messageLogSchema.index({ campaignId: 1 });
messageLogSchema.index({ status: 1 });

// Update the updatedAt timestamp before saving
messageLogSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const MessageLog = mongoose.model('MessageLog', messageLogSchema);

module.exports = MessageLog; 