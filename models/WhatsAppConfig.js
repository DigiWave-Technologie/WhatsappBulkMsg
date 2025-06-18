const mongoose = require('mongoose');

const whatsAppConfigSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    phoneNumber: {
        type: String,
        required: true,
        trim: true
    },
    whatsappBusinessAccountId: {
        type: String,
        required: true,
        trim: true
    },
    phoneNumberId: {
        type: String,
        required: true,
        trim: true
    },
    accessToken: {
        type: String,
        required: true,
        trim: true
    },
    is_active: {
        type: Boolean,
        default: true
    },
    is_default: {
        type: Boolean,
        default: false
    },
    name: {
        type: String,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    updated_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Add indexes for better query performance
whatsAppConfigSchema.index({ userId: 1, phoneNumber: 1 }, { unique: true });
whatsAppConfigSchema.index({ userId: 1, is_active: 1 });
whatsAppConfigSchema.index({ userId: 1, is_default: 1 });

const WhatsAppConfig = mongoose.model('WhatsAppConfig', whatsAppConfigSchema);

module.exports = WhatsAppConfig; 