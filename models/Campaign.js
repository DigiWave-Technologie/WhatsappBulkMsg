const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    templateId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Template',
        required: true
    },
    groupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
        required: true
    },
    status: {
        type: String,
        enum: ['draft', 'scheduled', 'running', 'completed', 'failed', 'cancelled'],
        default: 'draft'
    },
    scheduleTime: {
        type: Date
    },
    recipients: [{
        phone: {
            type: String,
            required: true
        },
        status: {
            type: String,
            enum: ['pending', 'sent', 'delivered', 'read', 'failed'],
            default: 'pending'
        },
        error: String,
        sentAt: Date,
        deliveredAt: Date,
        readAt: Date
    }],
    stats: {
        total: {
            type: Number,
            default: 0
        },
        sent: {
            type: Number,
            default: 0
        },
        delivered: {
            type: Number,
            default: 0
        },
        read: {
            type: Number,
            default: 0
        },
        failed: {
            type: Number,
            default: 0
        }
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed
    }
}, {
    timestamps: true
});

// Indexes for faster queries
campaignSchema.index({ userId: 1, status: 1 });
campaignSchema.index({ scheduleTime: 1 });
campaignSchema.index({ 'recipients.phone': 1 });

// Pre-save middleware to update stats
campaignSchema.pre('save', function(next) {
    if (this.isModified('recipients')) {
        this.stats = {
            total: this.recipients.length,
            sent: this.recipients.filter(r => r.status === 'sent').length,
            delivered: this.recipients.filter(r => r.status === 'delivered').length,
            read: this.recipients.filter(r => r.status === 'read').length,
            failed: this.recipients.filter(r => r.status === 'failed').length
        };
    }
    next();
});

const Campaign = mongoose.model('Campaign', campaignSchema);

module.exports = Campaign; 