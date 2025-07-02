const mongoose = require('mongoose');

const whatsAppOfficialCategorySchema = new mongoose.Schema({
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
        required: true,
        enum: ['marketing', 'transactional', 'utility'],
        default: 'marketing'
    },
    is_active: {
        type: Boolean,
        default: true
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
whatsAppOfficialCategorySchema.index({ name: 1 }, { unique: true });
whatsAppOfficialCategorySchema.index({ type: 1 });
whatsAppOfficialCategorySchema.index({ is_active: 1 });

const WhatsAppOfficialCategory = mongoose.model('WhatsAppOfficialCategory', whatsAppOfficialCategorySchema);

module.exports = WhatsAppOfficialCategory; 