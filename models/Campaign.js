const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    template: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Template',
        required: true
    },
    recipients: [{
        phoneNumber: {
            type: String,
            required: true
        },
        variables: {
            type: Map,
            of: String
        },
        status: {
            type: String,
            enum: ['pending', 'sent', 'failed', 'delivered', 'read'],
            default: 'pending'
        },
        error: String,
        sentAt: Date,
        deliveredAt: Date,
        readAt: Date
    }],
    schedule: {
        startAt: {
            type: Date,
            required: true
        },
        endAt: Date,
        timezone: {
            type: String,
            default: 'UTC'
        },
        delayBetweenMessages: {
            type: Number,
            default: 1000 // milliseconds
        }
    },
    status: {
        type: String,
        enum: ['draft', 'scheduled', 'running', 'paused', 'completed', 'failed', 'cancelled'],
        default: 'draft'
    },
    type: {
        type: String,
        enum: ['immediate', 'scheduled', 'recurring'],
        default: 'immediate'
    },
    recurringSchedule: {
        frequency: {
            type: String,
            enum: ['daily', 'weekly', 'monthly']
        },
        daysOfWeek: [{
            type: Number,
            min: 0,
            max: 6
        }],
        daysOfMonth: [{
            type: Number,
            min: 1,
            max: 31
        }],
        endDate: Date
    },
    media: [{
        type: {
            type: String,
            enum: ['image', 'video', 'document', 'audio'],
            required: true
        },
        url: {
            type: String,
            required: true
        },
        filename: String,
        mimeType: String,
        size: Number
    }],
    stats: {
        totalRecipients: {
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
        },
        creditsUsed: {
            type: Number,
            default: 0
        }
    },
    metadata: {
        type: Map,
        of: mongoose.Schema.Types.Mixed
    }
}, {
    timestamps: true
});

// Indexes for better query performance
campaignSchema.index({ createdBy: 1, status: 1 });
campaignSchema.index({ 'schedule.startAt': 1, status: 1 });
campaignSchema.index({ 'recipients.phoneNumber': 1 });
campaignSchema.index({ 'recipients.status': 1 });

// Pre-save middleware to update stats
campaignSchema.pre('save', function(next) {
    if (this.isModified('recipients')) {
        // Update total recipients count
        this.stats.totalRecipients = this.recipients.length;

        // Update status counts
        const statusCounts = this.recipients.reduce((acc, recipient) => {
            acc[recipient.status] = (acc[recipient.status] || 0) + 1;
            return acc;
        }, {});

        this.stats.sent = statusCounts.sent || 0;
        this.stats.delivered = statusCounts.delivered || 0;
        this.stats.read = statusCounts.read || 0;
        this.stats.failed = statusCounts.failed || 0;
    }
    next();
});

// Method to validate schedule
campaignSchema.methods.validateSchedule = function() {
    const now = new Date();
    
    if (this.schedule.startAt < now) {
        throw new Error('Campaign start time must be in the future');
    }

    if (this.schedule.endAt && this.schedule.endAt <= this.schedule.startAt) {
        throw new Error('Campaign end time must be after start time');
    }

    if (this.type === 'recurring') {
        if (!this.recurringSchedule || !this.recurringSchedule.frequency) {
            throw new Error('Recurring schedule frequency is required for recurring campaigns');
        }

        if (this.recurringSchedule.endDate && this.recurringSchedule.endDate <= this.schedule.startAt) {
            throw new Error('Recurring schedule end date must be after start time');
        }

        // Validate frequency-specific fields
        switch (this.recurringSchedule.frequency) {
            case 'weekly':
                if (!this.recurringSchedule.daysOfWeek || this.recurringSchedule.daysOfWeek.length === 0) {
                    throw new Error('Days of week are required for weekly recurring campaigns');
                }
                break;
            case 'monthly':
                if (!this.recurringSchedule.daysOfMonth || this.recurringSchedule.daysOfMonth.length === 0) {
                    throw new Error('Days of month are required for monthly recurring campaigns');
                }
                break;
        }
    }
};

// Method to update recipient status
campaignSchema.methods.updateRecipientStatus = async function(phoneNumber, status, metadata = {}) {
    const recipient = this.recipients.find(r => r.phoneNumber === phoneNumber);
    if (!recipient) {
        throw new Error('Recipient not found');
    }

    recipient.status = status;
    
    switch (status) {
        case 'sent':
            recipient.sentAt = new Date();
            break;
        case 'delivered':
            recipient.deliveredAt = new Date();
            break;
        case 'read':
            recipient.readAt = new Date();
            break;
        case 'failed':
            recipient.error = metadata.error || 'Unknown error';
            break;
    }

    await this.save();
    return recipient;
};

// Method to pause campaign
campaignSchema.methods.pause = async function() {
    if (this.status !== 'running') {
        throw new Error('Can only pause running campaigns');
    }
    this.status = 'paused';
    await this.save();
};

// Method to resume campaign
campaignSchema.methods.resume = async function() {
    if (this.status !== 'paused') {
        throw new Error('Can only resume paused campaigns');
    }
    this.status = 'running';
    await this.save();
};

// Method to cancel campaign
campaignSchema.methods.cancel = async function() {
    if (['completed', 'failed', 'cancelled'].includes(this.status)) {
        throw new Error('Cannot cancel a campaign that is already completed, failed, or cancelled');
    }
    this.status = 'cancelled';
    await this.save();
};

const Campaign = mongoose.model('Campaign', campaignSchema);

module.exports = Campaign; 