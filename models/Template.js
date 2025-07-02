const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    type: {
        type: String,
        enum: ['quick', 'csv', 'button', 'dp', 'poll', 'group', 'channel'],
        required: false
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    message: {
        text: {
            type: String,
            required: true
        },
        variables: [{
            name: String,
            type: {
                type: String,
                enum: ['text', 'number', 'date', 'currency', 'boolean', 'phone_number']
            },
            required: Boolean,
            description: String,
            defaultValue: String
        }]
    },
    images: [{
        url: String,
        caption: String,
        filename: String
    }],
    video: {
        url: String,
        caption: String,
        filename: String
    },
    pdf: {
        url: String,
        caption: String,
        filename: String
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
    category: {
        type: String,
        required: false
    },
    tags: [String],
    isPublic: {
        type: Boolean,
        default: false
    },
    usageCount: {
        type: Number,
        default: 0
    },
    lastUsed: {
        type: Date
    },
    metadata: {
        language: {
            type: String,
            default: 'en'
        },
        version: {
            type: String,
            default: '1.0'
        }
    },
    // Meta Graph API template data
    metaTemplate: {
        name: String,
        language: {
            code: String
        },
        namespace: String,
        status: {
            type: String,
            enum: ['PENDING', 'APPROVED', 'REJECTED', 'DISABLED'],
            default: 'PENDING'
        },
        category: {
            type: String,
            enum: [
                'ACCOUNT_UPDATE', 'PAYMENT_UPDATE', 'PERSONAL_FINANCE_UPDATE',
                'SHIPPING_UPDATE', 'RESERVATION_UPDATE', 'ISSUE_RESOLUTION',
                'APPOINTMENT_UPDATE', 'TRANSPORTATION_UPDATE', 'TICKET_UPDATE',
                'ALERT_UPDATE', 'AUTO_REPLY', 'MARKETING'
            ]
        },
        components: [{
            type: {
                type: String,
                enum: ['HEADER', 'BODY', 'FOOTER', 'BUTTONS'],
                required: true
            },
            text: String,
            format: {
                type: String,
                enum: ['TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT', 'LOCATION'],
                default: 'TEXT'
            },
            example: {
                header_text: [String],
                body_text: [[String]],
                header_handle: [String]
            }
        }],
        rejectionReason: String
    }
}, {
    timestamps: true
});

// Indexes for better query performance
templateSchema.index({ userId: 1, type: 1 });
templateSchema.index({ category: 1, tags: 1 });
templateSchema.index({ isPublic: 1 });
templateSchema.index({ 'metaTemplate.name': 1, 'metaTemplate.language.code': 1 });

// Methods
templateSchema.methods.incrementUsage = async function() {
    this.usageCount += 1;
    this.lastUsed = new Date();
    return this.save();
};

templateSchema.methods.clone = async function(userId) {
    const templateData = this.toObject();
    delete templateData._id;
    delete templateData.createdAt;
    delete templateData.updatedAt;
    templateData.userId = userId;
    templateData.usageCount = 0;
    templateData.lastUsed = null;
    
    const Template = mongoose.model('Template');
    return Template.create(templateData);
};

// Method to convert template to Meta WhatsApp API format
templateSchema.methods.toMetaApiFormat = function() {
    // Base message template structure for Meta API
    const metaTemplate = {
        name: this.metaTemplate.name || this.name.toLowerCase().replace(/\s+/g, '_'),
        language: this.metaTemplate.language || { code: 'en_US' },
        category: this.metaTemplate.category || 'MARKETING',
        components: []
    };

    // Add header if media exists
    if (this.images && this.images.length > 0) {
        const headerComponent = {
            type: 'HEADER',
            format: 'IMAGE'
        };
        
        // Add example URLs for media
        if (this.images[0].url) {
            headerComponent.example = {
                header_handle: [this.images[0].url]
            };
        }
        
        metaTemplate.components.push(headerComponent);
    }

    // Add body text
    if (this.message && this.message.text) {
        const bodyComponent = {
            type: 'BODY',
            text: this.message.text,
            example: {
                body_text: [[]]
            }
        };
        
        // Add variable examples
        if (this.message.variables && this.message.variables.length > 0) {
            const examples = this.message.variables.map(v => v.defaultValue || `example_${v.name}`);
            bodyComponent.example.body_text[0] = examples;
        }
        
        metaTemplate.components.push(bodyComponent);
    }

    // Add footer if exists
    if (this.footer) {
        metaTemplate.components.push({
            type: 'FOOTER',
            text: this.footer
        });
    }

    // Add buttons if they exist
    if (this.buttons && this.buttons.length > 0) {
        const buttonComponent = {
            type: 'BUTTONS',
            buttons: this.buttons.map(button => {
                // Convert to Meta button format based on type
                switch (button.type) {
                    case 'url':
                        return {
                            type: 'URL',
                            text: button.text,
                            url: button.value
                        };
                    case 'phone_number':
                        return {
                            type: 'PHONE_NUMBER',
                            text: button.text,
                            phone_number: button.value
                        };
                    case 'quick_reply':
                    default:
                        return {
                            type: 'QUICK_REPLY',
                            text: button.text
                        };
                }
            })
        };
        
        metaTemplate.components.push(buttonComponent);
    }

    return metaTemplate;
};

const Template = mongoose.model('Template', templateSchema);

module.exports = Template;
