const asyncHandler = require('../utils/asyncHandler');
const WhatsAppOfficialTemplate = require('../models/WhatsAppOfficialTemplate');
const mongoose = require('mongoose');

// Helper to map mimetype to template media type
const getMediaTypeFromMimetype = (mimetype) => {
    if (mimetype.startsWith('image/')) return 'image';
    if (mimetype.startsWith('video/')) return 'video';
    if (mimetype.startsWith('audio/')) return 'audio';
    if (mimetype === 'application/pdf') return 'pdf';
    if (mimetype.startsWith('application/')) return 'document';
    return 'document'; // Default for other application types
};

// Helper: Validate action_buttons constraints
function validateActionButtons(action_buttons = []) {
    let quickReplyCount = 0, visitWebsiteCount = 0, phoneNumberCount = 0, chatFlowCount = 0;
    for (const btn of action_buttons) {
        switch (btn.type) {
            case 'quick_reply': quickReplyCount++; break;
            case 'visit_website': visitWebsiteCount++; break;
            case 'phone_number': phoneNumberCount++; break;
            case 'flow': chatFlowCount++; break;
        }
    }
    if (quickReplyCount > 1) throw new Error('Only 1 Quick Reply button allowed');
    if (visitWebsiteCount > 2) throw new Error('Maximum 2 Visit Website buttons allowed');
    if (phoneNumberCount > 1) throw new Error('Only 1 Phone Number button allowed');
    if (chatFlowCount > 1) throw new Error('Only 1 Chat Flow button allowed');
}

// CREATE
const createTemplate = asyncHandler(async (req, res) => {
    let { template_name, category, language, template_type, header, body, footer_text, action_buttons } = req.body;
    // Parse JSON fields if sent as strings
    if (typeof header === 'string') header = JSON.parse(header);
    if (typeof action_buttons === 'string') action_buttons = JSON.parse(action_buttons);

    // If media file uploaded, set header.media.url
    if (req.file) {
        if (!header) header = {};
        header.type = 'media';
        header.media = header.media || {};
        header.media.url = `/uploads/whatsapp-media/${req.file.filename}`;
        header.media.type = getMediaTypeFromMimetype(req.file.mimetype);
        header.media.mimetype = req.file.mimetype;
        header.media.filename = req.file.filename;
    }

    validateActionButtons(action_buttons);
    const newTemplate = await WhatsAppOfficialTemplate.create({
        template_name,
        category,
        language,
        template_type,
        header,
        body,
        footer_text,
        action_buttons,
        created_by: req.user.userId
    });

    // Always include media info in the response
    if (newTemplate.header && newTemplate.header.media && newTemplate.header.media.url) {
        newTemplate.media = newTemplate.header.media;
    }

    res.status(201).json({
        success: true,
        data: newTemplate
    });
});

// READ ALL
const getTemplates = asyncHandler(async (req, res) => {
    const templates = await WhatsAppOfficialTemplate.find().populate('category').lean();
    // Always include media info in the response
    templates.forEach(t => {
        if (t.header && t.header.media && t.header.media.url) {
            t.media = t.header.media;
        }
    });
    res.json({ success: true, data: templates });
});

// READ ONE
const getTemplateById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: 'Invalid ID' });
    const template = await WhatsAppOfficialTemplate.findById(id).populate('category').lean();
    if (!template) return res.status(404).json({ success: false, message: 'Template not found' });
    // Always include media info in the response
    if (template.header && template.header.media && template.header.media.url) {
        template.media = template.header.media;
    }
    res.json({ success: true, data: template });
});

// UPDATE
const updateTemplate = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: 'Invalid ID' });
    let update = req.body;
    // Parse JSON fields if sent as strings
    if (typeof update.header === 'string') update.header = JSON.parse(update.header);
    if (typeof update.action_buttons === 'string') update.action_buttons = JSON.parse(update.action_buttons);

    // If media file uploaded, set header.media.url
    if (req.file) {
        if (!update.header) update.header = {};
        update.header.type = 'media';
        update.header.media = update.header.media || {};
        update.header.media.url = `/uploads/whatsapp-media/${req.file.filename}`;
        update.header.media.type = getMediaTypeFromMimetype(req.file.mimetype);
        update.header.media.mimetype = req.file.mimetype;
        update.header.media.filename = req.file.filename;
    }

    if (update.action_buttons) validateActionButtons(update.action_buttons);
    update.updated_by = req.user.userId;
    const template = await WhatsAppOfficialTemplate.findByIdAndUpdate(id, update, { new: true, runValidators: true });
    if (!template) return res.status(404).json({ success: false, message: 'Template not found' });
    res.json({ success: true, data: template });
});

// DELETE
const deleteTemplate = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: 'Invalid ID' });
    const template = await WhatsAppOfficialTemplate.findByIdAndDelete(id);
    if (!template) return res.status(404).json({ success: false, message: 'Template not found' });
    res.json({ success: true, message: 'Template deleted' });
});

// Fetch templates by category
const getTemplatesByCategory = asyncHandler(async (req, res) => {
    const { categoryId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(categoryId)) return res.status(400).json({ success: false, message: 'Invalid category ID' });
    const templates = await WhatsAppOfficialTemplate.find({ category: categoryId }).populate('category').lean();
    res.json({ success: true, data: templates });
});

// Fetch templates by user (created_by)
const getTemplatesByUser = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) return res.status(400).json({ success: false, message: 'Invalid user ID' });
    const templates = await WhatsAppOfficialTemplate.find({ created_by: userId }).populate('category').lean();
    res.json({ success: true, data: templates });
});

module.exports = {
    createTemplate,
    getTemplates,
    getTemplateById,
    updateTemplate,
    deleteTemplate,
    getTemplatesByCategory,
    getTemplatesByUser
};
