const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String
  },
  creditCost: {
    type: Number,
    required: true,
    default: 1
  },
  campaignTypes: [{
    type: {
      type: String,
      enum: [
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
      ]
    },
    creditMultiplier: {
      type: Number,
      default: 1.0
    },
    campaignIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campaign'
    }]
  }],
  mediaCreditCost: {
    type: Number,
    default: 1
  },
  interactiveCreditCost: {
    type: Number,
    default: 1
  },
  isActive: {
    type: Boolean,
    default: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
}, { timestamps: true });

// Indexes for better query performance
categorySchema.index({ name: 1, isActive: 1 });
categorySchema.index({ 'campaignTypes.type': 1 });
categorySchema.index({ 'campaignTypes.campaignIds': 1 });

// Method to add campaign to category
categorySchema.methods.addCampaign = async function(campaignId, campaignType) {
  const campaignTypeObj = this.campaignTypes.find(ct => ct.type === campaignType);
  if (campaignTypeObj) {
    if (!campaignTypeObj.campaignIds.includes(campaignId)) {
      campaignTypeObj.campaignIds.push(campaignId);
      await this.save();
    }
  }
  return this;
};

// Method to remove campaign from category
categorySchema.methods.removeCampaign = async function(campaignId) {
  this.campaignTypes.forEach(ct => {
    ct.campaignIds = ct.campaignIds.filter(id => id.toString() !== campaignId.toString());
  });
  await this.save();
  return this;
};

// Method to get campaigns by type
categorySchema.methods.getCampaignsByType = function(campaignType) {
  const campaignTypeObj = this.campaignTypes.find(ct => ct.type === campaignType);
  return campaignTypeObj ? campaignTypeObj.campaignIds : [];
};

const Category = mongoose.model('Category', categorySchema);

module.exports = Category; 