const mongoose = require('mongoose');

const whatsAppOfficialTemplateSchema = new mongoose.Schema({
    template_name: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'WhatsAppOfficialCategory',
        required: true
    },
    language: {
        type: String,
        required: true,
        enum: ['en_US', 'en_GB', 'es_ES', 'es_MX', 'fr_FR', 'de_DE', 'it_IT', 'pt_BR', 'pt_PT', 'hi_IN', 'ar_SA', 'en', 'es', 'fr', 'de', 'it', 'pt', 'hi', 'ar'] // Meta API format and simple format
    },
    template_type: {
        type: String,
        required: true,
        enum: ['basic', 'carousel']
    },
    enable_click_tracking: {
        type: Boolean,
        default: false
    },
    header: {
        type: {
            type: String,
            enum: ['none', 'text', 'media'],
            default: 'none'
        },
        text: String,
        media: {
            type: {
                type: String,
                enum: ['image', 'video', 'document', 'audio', 'sticker', 'location', 'dp', 'none', 'pdf']
            },
            url: String
        }
    },
    body: {
        type: String,
        required: true,
        maxlength: 1024
    },
    footer_text: {
        type: String,
        trim: true
    },
    action_buttons: [{
        type: {
            type: String,
            enum: ['quick_reply', 'visit_website', 'phone_number', 'flow', 'url']
        },
        button_text: String,
        url_type: { 
            type: String,
            enum: ['static', 'dynamic'],
            required: function() { return this.type === 'visit_website'; }
        },
        url: String,
        phone_number: String,
        flow_id: String,
        navigate_screen: String
    }],
    status: {
        type: String,
        enum: ['pending', 'approved', 'disapproved'],
        default: 'pending'
    },
    meta_template_id: {
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
whatsAppOfficialTemplateSchema.index({ template_name: 1, language: 1 }, { unique: true });
whatsAppOfficialTemplateSchema.index({ category: 1 });
whatsAppOfficialTemplateSchema.index({ status: 1 });

const WhatsAppOfficialTemplate = mongoose.model('WhatsAppOfficialTemplate', whatsAppOfficialTemplateSchema);

module.exports = WhatsAppOfficialTemplate; 