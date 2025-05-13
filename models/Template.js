const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        required: true,
        enum: ['MARKETING', 'UTILITY', 'AUTHENTICATION']
    },
    language: {
        type: String,
        required: true,
        default: 'en'
    },
    components: [{
        type: {
            type: String,
            enum: ['HEADER', 'BODY', 'FOOTER', 'BUTTONS'],
            required: true
        },
        format: {
            type: String,
            enum: ['TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT'],
            required: function() {
                return this.type === 'HEADER';
            }
        },
        text: {
            type: String,
            required: function() {
                return this.type === 'BODY' || (this.type === 'HEADER' && this.format === 'TEXT');
            }
        },
        buttons: [{
            type: {
                type: String,
                enum: ['QUICK_REPLY', 'URL', 'PHONE_NUMBER', 'COPY_CODE'],
                required: true
            },
            text: {
                type: String,
                required: true
            },
            url: {
                type: String,
                required: function() {
                    return this.type === 'URL';
                }
            },
            phoneNumber: {
                type: String,
                required: function() {
                    return this.type === 'PHONE_NUMBER';
                }
            },
            example: [String]
        }],
        example: {
            header_text: [String],
            body_text: [String],
            header_handle: [String],
            header_url: [String]
        }
    }],
    status: {
        type: String,
        default: 'pending',
        enum: ['pending', 'approved', 'rejected']
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    metadata: {
        approvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        approvedAt: Date,
        rejectionReason: String,
        whatsappTemplateId: String,
        whatsappCategory: String,
        whatsappLanguage: String,
        whatsappComponents: [{
            type: String,
            format: String,
            text: String,
            buttons: [{
                type: String,
                text: String,
                url: String,
                phoneNumber: String
            }]
        }]
    }
}, {
    timestamps: true
});

// Method to validate template components
templateSchema.methods.validateComponents = function() {
    const errors = [];
    
    // Check if template has at least one component
    if (!this.components || this.components.length === 0) {
        errors.push('Template must have at least one component');
        return errors;
    }

    // Validate each component
    this.components.forEach((component, index) => {
        // Validate required fields based on component type
        if (!component.type) {
            errors.push(`Component ${index + 1} must have a type`);
        }

        // Validate header format
        if (component.type === 'HEADER' && !component.format) {
            errors.push(`Header component must have a format`);
        }

        // Validate text for BODY or TEXT header
        if ((component.type === 'BODY' || (component.type === 'HEADER' && component.format === 'TEXT')) && !component.text) {
            errors.push(`${component.type} component must have text`);
        }

        // Validate buttons
        if (component.type === 'BUTTONS') {
            if (!component.buttons || component.buttons.length === 0) {
                errors.push('Buttons component must have at least one button');
            } else {
                component.buttons.forEach((button, btnIndex) => {
                    if (!button.type || !button.text) {
                        errors.push(`Button ${btnIndex + 1} must have type and text`);
                    }
                    if (button.type === 'URL' && !button.url) {
                        errors.push(`URL button ${btnIndex + 1} must have a URL`);
                    }
                    if (button.type === 'PHONE_NUMBER' && !button.phoneNumber) {
                        errors.push(`Phone number button ${btnIndex + 1} must have a phone number`);
                    }
                });
            }
        }
    });

    return errors;
};

// Method to format template for WhatsApp API
templateSchema.methods.formatForWhatsApp = function() {
    return {
        name: this.name,
        category: this.category,
        language: this.language,
        components: this.components.map(component => {
            const formattedComponent = {
                type: component.type
            };

            if (component.format) {
                formattedComponent.format = component.format;
            }

            if (component.text) {
                formattedComponent.text = component.text;
            }

            if (component.buttons && component.buttons.length > 0) {
                formattedComponent.buttons = component.buttons.map(button => {
                    const formattedButton = {
                        type: button.type,
                        text: button.text
                    };

                    if (button.type === 'URL') {
                        formattedButton.url = button.url;
                    } else if (button.type === 'PHONE_NUMBER') {
                        formattedButton.phone_number = button.phoneNumber;
                    }

                    return formattedButton;
                });
            }

            return formattedComponent;
        })
    };
};

// Indexes for better query performance
templateSchema.index({ userId: 1, status: 1 });
templateSchema.index({ name: 1, language: 1 }, { unique: true });

module.exports = mongoose.models.Template || mongoose.model('Template', templateSchema);
