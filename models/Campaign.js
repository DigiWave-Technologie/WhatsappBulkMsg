const mongoose = require('mongoose');

const recipientSchema = new mongoose.Schema({
    phoneNumber: {
        type: String,
        required: true,
        trim: true
    },
    status: {
        type: String,
        enum: ['pending', 'sent', 'delivered', 'read', 'failed'],
        default: 'pending'
    },
    variables: {
        type: Map,
        of: String
    },
    metadata: {
        wamid: String, // WhatsApp Message ID from Meta API
        errorMessage: String,
        errorCode: String,
        sentAt: Date,
        deliveredAt: Date,
        readAt: Date
    },
    retryCount: {
        type: Number,
        default: 0
    }
}, { _id: false });

const campaignSchema = new mongoose.Schema({
    campaign_title: {
        type: String,
        required: true,
        trim: true
    },
    message: {
        type: String,
        trim: true
    },
    numbers: {
        type: [String] // Assuming numbers are an array of strings
    },
    media_url: {
        type: String // Assuming media_url is a single string URL
    },
    group_id: {
        type: mongoose.Schema.Types.ObjectId, // Assuming group_id references another collection
        ref: 'Group'
    },
    campaignStatus: {
        type: String,
        enum: ['pending', 'sent', 'failed', 'completed'],
        default: 'pending'
    },
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
            'INTERNATIONAL_VIRTUAL_BUTTON',
            'WHATSAPP_OFFICIAL'
        ],
        required: true
    },
    status: {
        type: String,
        enum: ['draft', 'scheduled', 'running', 'paused', 'completed', 'failed', 'cancelled'],
        default: 'draft'
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    templateId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Template'
    },
    // For Meta Graph API, we need template name and language
    metaTemplate: {
        name: String,
        language: {
            code: String
        },
        namespace: String // Business account namespace
    },
    message: {
        text: String,
        variables: [{
            name: String,
            type: {
                type: String,
                enum: ['text', 'number', 'date', 'currency', 'boolean']
            },
            description: String,
            required: Boolean
        }]
    },
    media: {
        type: {
            type: String,
            enum: ['image', 'video', 'document', 'audio', 'sticker', 'location', 'dp', 'none'],
            default: 'none'
        },
        url: String,
        caption: String,
        filename: String,
        // For Meta Graph API
        mediaId: String, // Media ID from Meta API
        handleId: String // Business account ID
    },
    buttons: [{
        type: {
            type: String,
            enum: ['quick_reply', 'url', 'phone_number', 'copy_code', 'call_to_action']
        },
        text: String,
        value: String, // URL, phone number, or code to copy
        position: Number
    }],
    poll: {
        question: String,
        options: [{
            text: String,
            id: String
        }],
        allowMultipleAnswers: {
            type: Boolean,
            default: false
        },
        anonymous: {
            type: Boolean,
            default: true
        }
    },
    schedule: {
        startAt: {
            type: Date,
            required: true
        },
        endAt: Date,
        timezone: {
            type: String,
            default: 'UTC'
        }
    },
    recurringSchedule: {
        frequency: {
            type: String,
            enum: ['once', 'daily', 'weekly', 'monthly']
        },
        daysOfWeek: [Number], // 0-6 for Sunday-Saturday
        timeOfDay: String, // HH:mm format
        repeat: {
            type: Number,
            default: 1
        }
    },
    recipients: [recipientSchema],
    csvData: {
        url: String,
        filename: String,
        headers: [String],
        mappings: {
            phoneNumber: String, // Which column contains phone numbers
            variables: Map // Maps column names to variable names
        },
        totalRows: {
            type: Number,
            default: 0
        },
        processedRows: {
            type: Number,
            default: 0
        }
    },
    groupTargeting: {
        groupId: String,
        communityId: String,
        channelId: String
    },
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
        },
        responses: [{
            type: String,
            content: String,
            timestamp: Date,
            recipient: String
        }]
    },
    settings: {
        retryFailed: {
            type: Boolean,
            default: true
        },
        maxRetries: {
            type: Number,
            default: 3
        },
        delayBetweenMessages: {
            type: Number,
            default: 1 // in seconds
        },
        maxMessagesPerDay: Number,
        stopOnError: {
            type: Boolean,
            default: false
        }
    },
    metadata: {
        tags: [String],
        category: String,
        priority: {
            type: String,
            enum: ['low', 'medium', 'high'],
            default: 'medium'
        },
        source: {
            type: String,
            default: 'web'
        }
    },
    // Meta Graph API integration
    metaApiData: {
        phoneNumberId: String,
        businessAccountId: String,
        accessToken: String,
        templateName: String,
        templateLanguage: String,
        templateComponents: [{
            type: {
                type: String,
                enum: ['header', 'body', 'footer', 'buttons']
            },
            parameters: [{
                type: {
                    type: String,
                    enum: ['text', 'currency', 'date_time', 'image', 'document', 'video']
                },
                text: String,
                currency: {
                    code: String,
                    amount: Number
                },
                dateTime: {
                    fallbackValue: String
                },
                image: {
                    link: String
                },
                document: {
                    link: String,
                    filename: String
                },
                video: {
                    link: String
                }
            }]
        }]
    },
    // WhatsApp Official Campaign Fields
    sendType: {
        type: String,
        enum: ['csv', 'manual'],
        default: 'csv',
        description: 'How recipients are provided: csv upload or manual textarea input.'
    },
    countries: [{
        type: String,
        description: 'Country codes for multi-country campaigns.'
    }],
    messageLimit: {
        type: Number,
        description: 'Message limit provided by Facebook.'
    },
    batchSize: {
        type: Number,
        default: 1000,
        description: 'Batch size for split campaign.'
    },
    intervalTime: {
        type: Number,
        enum: [5, 10, 15, 30, 45, 60],
        description: 'Interval time in minutes between batches.'
    }
}, {
    timestamps: true
});

// Indexes for better query performance
campaignSchema.index({ userId: 1, status: 1 });
campaignSchema.index({ type: 1, status: 1 });
campaignSchema.index({ 'schedule.startAt': 1, status: 1 });
campaignSchema.index({ 'metaApiData.phoneNumberId': 1 });

// Methods
campaignSchema.methods.updateStats = async function(stats) {
    this.stats = { ...this.stats, ...stats };
    return this.save();
};

campaignSchema.methods.addResponse = async function(response) {
    this.stats.responses.push(response);
    return this.save();
};

campaignSchema.methods.pause = async function() {
    if (this.status === 'running' || this.status === 'scheduled') {
        this.status = 'paused';
        return this.save();
    }
    throw new Error('Campaign must be running or scheduled to pause');
};

campaignSchema.methods.resume = async function() {
    if (this.status === 'paused') {
        this.status = 'running';
        return this.save();
    }
    throw new Error('Campaign must be paused to resume');
};

campaignSchema.methods.cancel = async function() {
    if (['scheduled', 'running', 'paused'].includes(this.status)) {
        this.status = 'cancelled';
        return this.save();
    }
    throw new Error('Campaign must be scheduled, running, or paused to cancel');
};

campaignSchema.methods.updateRecipientStatus = async function(phoneNumber, status, metadata = {}) {
    const recipient = this.recipients.find(r => r.phoneNumber === phoneNumber);
    if (recipient) {
        recipient.status = status;
        if (metadata.wamid) recipient.metadata.wamid = metadata.wamid;
        if (status === 'sent') recipient.metadata.sentAt = new Date();
        if (status === 'delivered') recipient.metadata.deliveredAt = new Date();
        if (status === 'read') recipient.metadata.readAt = new Date();
        if (status === 'failed') {
            recipient.metadata.errorMessage = metadata.errorMessage;
            recipient.metadata.errorCode = metadata.errorCode;
        }
        
        // Update campaign stats
        this.stats[status] = (this.stats[status] || 0) + 1;
        return this.save();
    }
    return null;
};

const Campaign = mongoose.model('Campaign', campaignSchema);

module.exports = Campaign;