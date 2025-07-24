const whatsappTemplateService = require('../services/whatsappTemplateService');
const WhatsAppOfficialTemplate = require('../models/WhatsAppOfficialTemplate');
const WhatsAppOfficialCategory = require('../models/WhatsAppOfficialCategory');
const asyncHandler = require('../utils/asyncHandler');
const { ApiError } = require('../utils/ApiError');
const logger = require('../utils/logger');

/**
 * Create template with Meta API integration
 */
const createTemplate = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    
    // Validate required fields
    const {
        template_name,
        category,
        language,
        template_type,
        body
    } = req.body;

    if (!template_name || !category || !language || !template_type || !body) {
        throw new ApiError(400, 'Missing required fields: template_name, category, language, template_type, body');
    }

    // Validate category exists
    const categoryExists = await WhatsAppOfficialCategory.findById(category);
    if (!categoryExists) {
        throw new ApiError(404, 'Category not found');
    }

    // Check if template with same name already exists for this user
    const existingTemplate = await WhatsAppOfficialTemplate.findOne({
        template_name,
        created_by: userId
    });

    if (existingTemplate) {
        throw new ApiError(400, 'Template with this name already exists');
    }

    // Create template using the service
    const result = await whatsappTemplateService.createTemplate(userId, req.body);

    res.status(201).json({
        success: true,
        message: 'Template created successfully',
        data: result
    });
});

/**
 * Get all templates for user
 */
const getTemplates = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { page = 1, limit = 10, status, search } = req.query;

    const query = { created_by: userId };

    // Add status filter
    if (status) {
        query.status = status;
    }

    // Add search filter
    if (search) {
        query.$or = [
            { template_name: { $regex: search, $options: 'i' } },
            { body: { $regex: search, $options: 'i' } }
        ];
    }

    const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        populate: [
            { path: 'category', select: 'name description' }
        ],
        sort: { createdAt: -1 }
    };

    const templates = await WhatsAppOfficialTemplate.paginate(query, options);

    res.status(200).json({
        success: true,
        data: templates
    });
});

/**
 * Get template by ID
 */
const getTemplate = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { id } = req.params;

    const template = await WhatsAppOfficialTemplate.findOne({
        _id: id,
        created_by: userId
    }).populate('category', 'name description');

    if (!template) {
        throw new ApiError(404, 'Template not found');
    }

    res.status(200).json({
        success: true,
        data: template
    });
});

/**
 * Update template
 */
const updateTemplate = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { id } = req.params;

    const template = await WhatsAppOfficialTemplate.findOne({
        _id: id,
        created_by: userId
    });

    if (!template) {
        throw new ApiError(404, 'Template not found');
    }

    // Check if template is already approved - can't edit approved templates
    if (template.meta_status === 'APPROVED') {
        throw new ApiError(400, 'Cannot edit approved templates');
    }

    // Validate category if provided
    if (req.body.category) {
        const categoryExists = await WhatsAppOfficialCategory.findById(req.body.category);
        if (!categoryExists) {
            throw new ApiError(404, 'Category not found');
        }
    }

    // Check if updating name to one that already exists
    if (req.body.template_name && req.body.template_name !== template.template_name) {
        const existingTemplate = await WhatsAppOfficialTemplate.findOne({
            template_name: req.body.template_name,
            created_by: userId,
            _id: { $ne: id }
        });

        if (existingTemplate) {
            throw new ApiError(400, 'Template with this name already exists');
        }
    }

    // Update template
    const updatedTemplate = await WhatsAppOfficialTemplate.findByIdAndUpdate(
        id,
        {
            ...req.body,
            updated_by: userId,
            // Reset sync status if content changed
            ...(req.body.body || req.body.header || req.body.footer_text || req.body.action_buttons) && {
                sync_status: 'not_synced',
                meta_status: null,
                meta_template_id: null
            }
        },
        { new: true, runValidators: true }
    ).populate('category', 'name description');

    res.status(200).json({
        success: true,
        message: 'Template updated successfully',
        data: updatedTemplate
    });
});

/**
 * Delete template
 */
const deleteTemplate = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { id } = req.params;

    const template = await WhatsAppOfficialTemplate.findOne({
        _id: id,
        created_by: userId
    });

    if (!template) {
        throw new ApiError(404, 'Template not found');
    }

    await WhatsAppOfficialTemplate.findByIdAndDelete(id);

    res.status(200).json({
        success: true,
        message: 'Template deleted successfully'
    });
});

/**
 * Sync template to Meta API
 */
const syncTemplate = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { id } = req.params;

    const template = await WhatsAppOfficialTemplate.findOne({
        _id: id,
        created_by: userId
    });

    if (!template) {
        throw new ApiError(404, 'Template not found');
    }

    if (template.sync_status === 'synced' && template.meta_template_id) {
        throw new ApiError(400, 'Template is already synced');
    }

    // Create template data for sync
    const templateData = {
        template_name: template.template_name,
        category: template.category,
        language: template.language,
        template_type: template.template_type,
        header: template.header,
        body: template.body,
        footer_text: template.footer_text,
        action_buttons: template.action_buttons,
        whatsapp_business_account_id: template.whatsapp_business_account_id,
        auto_sync_to_meta: true,
        meta_category: template.meta_category
    };

    // Use the service to sync
    const result = await whatsappTemplateService.createTemplate(userId, templateData);

    res.status(200).json({
        success: true,
        message: 'Template synced successfully',
        data: result.syncResult
    });
});

/**
 * Get template status from Meta API
 */
const getTemplateStatus = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { id } = req.params;

    const template = await WhatsAppOfficialTemplate.findOne({
        _id: id,
        created_by: userId
    });

    if (!template) {
        throw new ApiError(404, 'Template not found');
    }

    if (!template.meta_template_id) {
        throw new ApiError(400, 'Template is not synced to Meta API');
    }

    // Get WhatsApp config
    const config = await whatsappTemplateService.getWhatsAppConfig(userId, template.whatsapp_business_account_id);
    
    // Get status from Meta API
    const metaStatus = await whatsappTemplateService.getTemplateStatus(template.meta_template_id, config);

    // Update local template with latest status
    await WhatsAppOfficialTemplate.findByIdAndUpdate(id, {
        meta_status: metaStatus.status,
        last_sync_at: new Date()
    });

    res.status(200).json({
        success: true,
        data: {
            localStatus: template.status,
            metaStatus: metaStatus.status,
            lastSync: new Date(),
            metaData: metaStatus
        }
    });
});

module.exports = {
    createTemplate,
    getTemplates,
    getTemplate,
    updateTemplate,
    deleteTemplate,
    syncTemplate,
    getTemplateStatus
};
