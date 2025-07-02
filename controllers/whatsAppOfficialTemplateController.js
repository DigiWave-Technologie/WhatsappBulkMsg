const WhatsAppOfficialTemplate = require('../models/WhatsAppOfficialTemplate');
const WhatsAppOfficialCategory = require('../models/WhatsAppOfficialCategory');
const { ApiError } = require('../utils/ApiError');
const logger = require('../utils/logger');

// Create a new template
exports.createTemplate = async (req, res) => {
    try {
        const {
            template_name,
            category,
            language,
            template_type,
            enable_click_tracking,
            header,
            body,
            footer_text,
            action_buttons
        } = req.body;

        // Validate category exists
        const categoryExists = await WhatsAppOfficialCategory.findById(category);
        if (!categoryExists) {
            throw new ApiError(404, 'Category not found');
        }

        // Check if template with same name and language exists
        const existingTemplate = await WhatsAppOfficialTemplate.findOne({
            template_name,
            language
        });

        if (existingTemplate) {
            throw new ApiError(400, 'Template with this name and language already exists');
        }

        const template = await WhatsAppOfficialTemplate.create({
            template_name,
            category,
            language,
            template_type,
            enable_click_tracking,
            header,
            body,
            footer_text,
            action_buttons,
            created_by: req.user.userId
        });

        res.status(201).json({
            success: true,
            data: template
        });
    } catch (error) {
        logger.error('Error creating template:', error);
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
};

// Get all templates with filters
exports.getTemplates = async (req, res) => {
    try {
        const {
            category,
            language,
            template_type,
            status,
            page = 1,
            limit = 10
        } = req.query;

        const query = {};

        if (category) query.category = category;
        if (language) query.language = language;
        if (template_type) query.template_type = template_type;
        if (status) query.status = status;

        const templates = await WhatsAppOfficialTemplate.find(query)
            .populate('category', 'name type')
            .populate('created_by', 'name email')
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });

        const total = await WhatsAppOfficialTemplate.countDocuments(query);

        res.status(200).json({
            success: true,
            data: templates,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        logger.error('Error fetching templates:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get template by ID
exports.getTemplateById = async (req, res) => {
    try {
        const template = await WhatsAppOfficialTemplate.findById(req.params.id)
            .populate('category', 'name type')
            .populate('created_by', 'name email');

        if (!template) {
            throw new ApiError(404, 'Template not found');
        }

        res.status(200).json({
            success: true,
            data: template
        });
    } catch (error) {
        logger.error('Error fetching template:', error);
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
};

// Update template
exports.updateTemplate = async (req, res) => {
    try {
        const {
            template_name,
            category,
            language,
            template_type,
            enable_click_tracking,
            header,
            body,
            footer_text,
            action_buttons,
            status
        } = req.body;

        const template = await WhatsAppOfficialTemplate.findById(req.params.id);

        if (!template) {
            throw new ApiError(404, 'Template not found');
        }

        // Check if updating to a name that already exists
        if (template_name && template_name !== template.template_name) {
            const existingTemplate = await WhatsAppOfficialTemplate.findOne({
                template_name,
                language: language || template.language,
                _id: { $ne: template._id }
            });

            if (existingTemplate) {
                throw new ApiError(400, 'Template with this name and language already exists');
            }
        }

        // Update fields
        const updateFields = {
            template_name: template_name || template.template_name,
            category: category || template.category,
            language: language || template.language,
            template_type: template_type || template.template_type,
            enable_click_tracking: enable_click_tracking !== undefined ? enable_click_tracking : template.enable_click_tracking,
            header: header || template.header,
            body: body || template.body,
            footer_text: footer_text !== undefined ? footer_text : template.footer_text,
            action_buttons: action_buttons || template.action_buttons,
            status: status || template.status,
            updated_by: req.user.userId
        };

        const updatedTemplate = await WhatsAppOfficialTemplate.findByIdAndUpdate(
            req.params.id,
            updateFields,
            { new: true, runValidators: true }
        ).populate('category', 'name type')
         .populate('created_by', 'name email')
         .populate('updated_by', 'name email');

        res.status(200).json({
            success: true,
            data: updatedTemplate
        });
    } catch (error) {
        logger.error('Error updating template:', error);
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
};

// Delete template
exports.deleteTemplate = async (req, res) => {
    try {
        const template = await WhatsAppOfficialTemplate.findById(req.params.id);

        if (!template) {
            throw new ApiError(404, 'Template not found');
        }

        await template.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Template deleted successfully'
        });
    } catch (error) {
        logger.error('Error deleting template:', error);
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
};

// Update template status
exports.updateTemplateStatus = async (req, res) => {
    try {
        const { status } = req.body;

        if (!['pending', 'approved', 'disapproved'].includes(status)) {
            throw new ApiError(400, 'Invalid status');
        }

        const template = await WhatsAppOfficialTemplate.findByIdAndUpdate(
            req.params.id,
            {
                status,
                updated_by: req.user.userId
            },
            { new: true, runValidators: true }
        ).populate('category', 'name type')
         .populate('created_by', 'name email')
         .populate('updated_by', 'name email');

        if (!template) {
            throw new ApiError(404, 'Template not found');
        }

        res.status(200).json({
            success: true,
            data: template
        });
    } catch (error) {
        logger.error('Error updating template status:', error);
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
}; 