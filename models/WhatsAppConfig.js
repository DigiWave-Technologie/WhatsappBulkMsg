const mongoose = require('mongoose');

const whatsAppConfigSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    whatsappBusinessAccountId: {
        type: String,
        required: true
    },
    phoneNumberId: {
        type: String,
        required: true
    },
    accessToken: {
        type: String,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt timestamp before saving
whatsAppConfigSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('WhatsAppConfig', whatsAppConfigSchema); 