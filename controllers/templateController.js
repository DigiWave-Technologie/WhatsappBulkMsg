const templateService = require('../services/templateService');
const { asyncHandler } = require('../middleware/errorHandler');

// Create a new template
const createTemplate = asyncHandler(async (req, res) => {
    const templateData = req.body;
    const userId = req.user.userId;

    // Validate template data
    await templateService.validateTemplate(templateData);

    const template = await templateService.createTemplate(templateData, userId);

    res.status(201).json({
        success: true,
        message: 'Template created successfully',
        data: template
    });
});

// Update a template
const updateTemplate = asyncHandler(async (req, res) => {
    const { templateId } = req.params;
    const templateData = req.body;
    const userId = req.user.userId;

    // Validate template data
    await templateService.validateTemplate(templateData);

    const template = await templateService.updateTemplate(templateId, templateData, userId);

    res.status(200).json({
        success: true,
        message: 'Template updated successfully',
        data: template
    });
});

// Approve a template
const approveTemplate = asyncHandler(async (req, res) => {
    const { templateId } = req.params;
    const approverId = req.user.userId;

    const template = await templateService.approveTemplate(templateId, approverId);

    res.status(200).json({
        success: true,
        message: 'Template approved successfully',
        data: template
    });
});

// Reject a template
const rejectTemplate = asyncHandler(async (req, res) => {
    const { templateId } = req.params;
    const { reason } = req.body;
    const approverId = req.user.userId;

    if (!reason) {
        return res.status(400).json({
            success: false,
            message: 'Rejection reason is required'
        });
    }

    const template = await templateService.rejectTemplate(templateId, approverId, reason);

    res.status(200).json({
        success: true,
        message: 'Template rejected successfully',
        data: template
    });
});

// Get template by ID
const getTemplateById = asyncHandler(async (req, res) => {
    const { templateId } = req.params;
    const userId = req.user.userId;

    const template = await templateService.getTemplateById(templateId, userId);

    res.status(200).json({
        success: true,
        data: template
    });
});

// Get user's templates
const getUserTemplates = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const filters = req.query;

    const templates = await templateService.getUserTemplates(userId, filters);

    res.status(200).json({
        success: true,
        data: templates
    });
});

// Get pending templates (for admins)
const getPendingTemplates = asyncHandler(async (req, res) => {
    const templates = await templateService.getPendingTemplates();

    res.status(200).json({
        success: true,
        data: templates
    });
});

// Delete a template
const deleteTemplate = asyncHandler(async (req, res) => {
    const { templateId } = req.params;
    const userId = req.user.userId;

    const result = await templateService.deleteTemplate(templateId, userId);

    res.status(200).json({
        success: true,
        message: result.message
    });
});

module.exports = {
    createTemplate,
    updateTemplate,
    approveTemplate,
    rejectTemplate,
    getTemplateById,
    getUserTemplates,
    getPendingTemplates,
    deleteTemplate
}; 