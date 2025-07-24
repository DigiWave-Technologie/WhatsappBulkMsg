const metaTemplateService = require('../services/metaTemplateService');
const asyncHandler = require('../utils/asyncHandler');
const { ApiError } = require('../utils/ApiError');
const logger = require('../utils/logger');
const WhatsAppOfficialCategory = require('../models/WhatsAppOfficialCategory');
const Category = require('../models/Category');
const { checkPermission } = require('../utils/permissions');

/**
 * Create WhatsApp template directly in Meta API
 */
const createTemplate = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    
    // Validate user authentication
    if (!userId) {
        return res.status(401).json({
            success: false,
            message: 'User authentication required'
        });
    }

    // Check user permissions
    if (!checkPermission(req.user, 'manage_templates')) {
        return res.status(403).json({
            success: false,
            message: 'Insufficient permissions to create templates'
        });
    }

    // Validate request body
    const {
        template_name,
        language,
        body,
        whatsapp_official_category_id,
        campaign_category_id
    } = req.body;

    if (!template_name || !language || !body) {
        return res.status(400).json({
            success: false,
            message: 'Missing required fields',
            errors: [
                { field: 'template_name', message: 'Template name is required' },
                { field: 'language', message: 'Language is required' },
                { field: 'body', message: 'Body text is required' }
            ].filter(error => !req.body[error.field])
        });
    }

    // Validate categories if provided
    if (whatsapp_official_category_id) {
        const whatsappCategory = await WhatsAppOfficialCategory.findById(whatsapp_official_category_id);
        if (!whatsappCategory) {
            return res.status(404).json({
                success: false,
                message: 'WhatsApp Official Category not found'
            });
        }
    }

    if (campaign_category_id) {
        const campaignCategory = await Category.findById(campaign_category_id);
        if (!campaignCategory) {
            return res.status(404).json({
                success: false,
                message: 'Campaign Category not found'
            });
        }
    }

    logger.info('Creating WhatsApp template directly in Meta API:', {
        userId,
        templateName: template_name
    });

    // Create template directly in Meta API
    const result = await metaTemplateService.createTemplate(userId, req.body);

    res.status(201).json({
        success: true,
        message: 'WhatsApp template created successfully in Meta API',
        data: result,
        credit_summary: {
            credits_deducted: result.credit_info?.credits_deducted || 0,
            category_used: result.credit_info?.campaign_category,
            transaction_id: result.credit_info?.transaction_id
        }
    });
});

/**
 * Get all templates from Meta API
 */
const getTemplates = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { limit, after, search, include_credit_info } = req.query;

    // Check user permissions
    if (!checkPermission(req.user, 'manage_templates')) {
        return res.status(403).json({
            success: false,
            message: 'Insufficient permissions to view templates'
        });
    }

    logger.info('Fetching templates from Meta API:', {
        userId,
        userRole: req.user.role,
        limit,
        after
    });

    const result = await metaTemplateService.getTemplates(userId, {
        limit: parseInt(limit) || 25,
        after,
        include_credit_info: include_credit_info === 'true'
    });

    // Filter by search term if provided
    let filteredData = result.data;
    if (search) {
        const searchLower = search.toLowerCase();
        filteredData = result.data.filter(template => 
            template.name.toLowerCase().includes(searchLower) ||
            template.status.toLowerCase().includes(searchLower) ||
            template.category.toLowerCase().includes(searchLower)
        );
    }

    res.status(200).json({
        success: true,
        data: filteredData,
        pagination: {
            total: filteredData.length,
            limit: parseInt(limit) || 25,
            paging: result.paging
        }
    });
});

/**
 * Get all templates with full details from Meta API
 */
const getAllTemplatesWithDetails = asyncHandler(async (req, res) => {
    const userId = req.user.userId;

    // Check user permissions for viewing WhatsApp Official templates
    if (!checkPermission(req.user, 'view_whatsapp_official_templates')) {
        return res.status(403).json({
            success: false,
            message: 'Insufficient permissions to view WhatsApp Official templates'
        });
    }

    logger.info('Getting all templates with full details from Meta API:', {
        userId,
        userRole: req.user.role
    });

    const result = await metaTemplateService.getAllTemplatesWithDetails(userId, req.query);

    res.status(200).json({
        success: true,
        message: 'All templates retrieved successfully',
        data: result.data,
        total: result.total,
        fetched_at: result.fetched_at
    });
});

/**
 * Get single template from Meta API
 */
const getTemplate = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { id } = req.params;

    if (!id) {
        throw new ApiError(400, 'Template ID is required');
    }

    logger.info('Fetching template from Meta API:', {
        userId,
        templateId: id
    });

    const template = await metaTemplateService.getTemplate(userId, id);

    res.status(200).json({
        success: true,
        data: template
    });
});

/**
 * Delete template from Meta API
 */
const deleteTemplate = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { id } = req.params;

    if (!id) {
        throw new ApiError(400, 'Template ID is required');
    }

    logger.info('Deleting template from Meta API:', {
        userId,
        templateId: id
    });

    const result = await metaTemplateService.deleteTemplate(userId, id);

    res.status(200).json({
        success: true,
        message: result.message,
        data: { templateId: id }
    });
});

/**
 * Delete multiple templates from Meta API (unlimited count)
 */
const deleteMultipleTemplates = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { templateIds } = req.body;

    // Check user permissions for deleting WhatsApp Official templates
    if (!checkPermission(req.user, 'canDeleteWhatsAppOfficialTemplates')) {
        return res.status(403).json({
            success: false,
            message: 'Insufficient permissions to delete WhatsApp Official templates'
        });
    }

    if (!templateIds || !Array.isArray(templateIds)) {
        return res.status(400).json({
            success: false,
            message: 'Template IDs must be provided as an array'
        });
    }

    logger.info('Bulk deleting templates from Meta API:', {
        userId,
        userRole: req.user.role,
        templateCount: templateIds.length
    });

    const result = await metaTemplateService.deleteMultipleTemplates(userId, templateIds);

    res.status(200).json({
        success: true,
        message: result.message,
        data: result.results,
        errors: result.errors,
        summary: result.summary
    });
});

/**
 * Update template (Delete and recreate)
 */
const updateTemplate = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { id } = req.params;

    if (!id) {
        throw new ApiError(400, 'Template ID is required');
    }

    logger.info('Updating template (delete and recreate) in Meta API:', {
        userId,
        templateId: id
    });

    // First, get the existing template to preserve some data
    const existingTemplate = await metaTemplateService.getTemplate(userId, id);
    
    // Delete the existing template
    await metaTemplateService.deleteTemplate(userId, id);
    
    // Create new template with updated data
    const updatedData = {
        ...req.body,
        template_name: req.body.template_name || existingTemplate.name
    };
    
    const newTemplate = await metaTemplateService.createTemplate(userId, updatedData);

    res.status(200).json({
        success: true,
        message: 'Template updated successfully (recreated in Meta API)',
        data: newTemplate,
        note: 'Template was deleted and recreated due to Meta API limitations'
    });
});

/**
 * Get template analytics/insights
 */
const getTemplateAnalytics = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { id } = req.params;

    if (!id) {
        throw new ApiError(400, 'Template ID is required');
    }

    // Get template details
    const template = await metaTemplateService.getTemplate(userId, id);

    // Basic analytics (can be extended with actual Meta API analytics)
    const analytics = {
        templateId: id,
        name: template.name,
        status: template.status,
        category: template.category,
        language: template.language,
        created_at: template.created_time || new Date().toISOString(),
        components_count: template.components?.length || 0,
        has_variables: template.components?.some(comp => 
            comp.text && /\{\{\d+\}\}/.test(comp.text)
        ) || false
    };

    res.status(200).json({
        success: true,
        data: analytics
    });
});

/**
 * Get WhatsApp Official Categories for template creation
 */
const getWhatsAppCategories = asyncHandler(async (req, res) => {
    const categories = await WhatsAppOfficialCategory.find({ is_active: true })
        .select('name description type')
        .sort({ name: 1 });

    res.status(200).json({
        success: true,
        data: categories
    });
});

/**
 * Get Campaign Categories for credit management
 */
const getCampaignCategories = asyncHandler(async (req, res) => {
    const categories = await Category.find({ isActive: true })
        .select('name description creditCost')
        .sort({ name: 1 });

    res.status(200).json({
        success: true,
        data: categories
    });
});

/**
 * Get user's credit balance for template creation
 */
const getUserCredits = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { Credit } = require('../models/Credit');

    const credits = await Credit.find({ userId })
        .populate('categoryId', 'name creditCost')
        .sort({ 'categoryId.name': 1 });

    const creditSummary = credits.map(credit => ({
        category: credit.categoryId.name,
        available_credits: credit.credit,
        is_unlimited: credit.isUnlimited,
        cost_per_template: credit.categoryId.creditCost,
        templates_possible: credit.isUnlimited ? 'Unlimited' : Math.floor(credit.credit / credit.categoryId.creditCost)
    }));

    res.status(200).json({
        success: true,
        data: creditSummary,
        total_categories: creditSummary.length
    });
});

module.exports = {
    createTemplate,
    getTemplates,
    getAllTemplatesWithDetails,
    getTemplate,
    deleteTemplate,
    deleteMultipleTemplates,
    updateTemplate,
    getTemplateAnalytics,
    getWhatsAppCategories,
    getCampaignCategories,
    getUserCredits
};
