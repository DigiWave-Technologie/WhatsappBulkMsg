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
        enum: ['en', 'es', 'fr', 'de', 'it', 'pt', 'hi', 'ar'] // Add more languages as needed
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
                enum: ['image', 'video', 'pdf']
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
            enum: ['quick_reply', 'visit_website', 'phone_number', 'flow']
        },
        button_text: String,
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