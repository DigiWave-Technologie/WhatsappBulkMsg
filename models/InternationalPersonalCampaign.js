const mongoose = require('mongoose');

const internationalPersonalCampaignSchema = new mongoose.Schema({
  campaignTitle: {
    type: String,
    required: true
  },
  selectedGroup: {
    type: String
  },
  whatsAppNumbers: {
    type: String,
    required: true
  },
  userMessage: {
    type: String,
    required: true
  },
  selectedTemplate: {
    type: String
  },
  userprofile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  button1Text: String,
  button1Number: String,
  button2Text: String,
  button2Url: String,
  image1: String,
  image2: String,
  image3: String,
  image4: String,
  pdf: String,
  video: String,
  excellsheet: String,
  image1Caption: String,
  image2Caption: String,
  image3Caption: String,
  image4Caption: String,
  pdfCaption: String,
  videoCaption: String,
  BetweenMessages: {
    type: Number,
    default: 0
  },
  countryCode: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'running', 'completed', 'failed', 'paused'],
    default: 'draft'
  },
  scheduleDate: Date,
  messageCount: {
    type: Number,
    default: 0
  },
  successCount: {
    type: Number,
    default: 0
  },
  failureCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for better query performance
internationalPersonalCampaignSchema.index({ userprofile: 1, createdAt: -1 });
internationalPersonalCampaignSchema.index({ status: 1 });
internationalPersonalCampaignSchema.index({ countryCode: 1 });

module.exports = mongoose.model('InternationalPersonalCampaign', internationalPersonalCampaignSchema); 