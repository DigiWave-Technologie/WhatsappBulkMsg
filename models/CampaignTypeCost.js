const mongoose = require('mongoose');

const campaignTypeCostSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['quick', 'csv', 'button', 'dp', 'poll', 'group', 'channel'],
        required: true
    },
    cost: {
        type: Number,
        required: true,
        min: 0
    },
    description: {
        type: String,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    metadata: {
        type: Map,
        of: mongoose.Schema.Types.Mixed
    }
}, { timestamps: true });

// Index for faster queries
campaignTypeCostSchema.index({ type: 1 }, { unique: true });

const CampaignTypeCost = mongoose.model('CampaignTypeCost', campaignTypeCostSchema);

module.exports = CampaignTypeCost; 