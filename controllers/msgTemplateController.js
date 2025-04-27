const templateService = require('../services/templateService');
const { asyncHandler } = require('../middleware/errorHandler');

// Add a new template
const addTemplate = asyncHandler(async (req, res) => {
    const templateData = req.body;
    const template = await templateService.createTemplate(req.user._id, templateData);
    res.status(201).json({ 
        success: true,
        message: "Template added successfully", 
        data: template 
    });
});

// Update a template by ID
const updateTemplate = asyncHandler(async (req, res) => {
    const templateId = req.params.id;
    const templateData = req.body;
    const template = await templateService.updateTemplate(templateId, req.user._id, templateData);
    res.status(200).json({ 
        success: true,
        message: "Template updated successfully", 
        data: template 
    });
});

// Delete a template by ID
const deleteTemplate = asyncHandler(async (req, res) => {
    const templateId = req.params.id;
    const template = await templateService.deleteTemplate(templateId, req.user._id);
    res.status(200).json({ 
        success: true,
        message: "Template deleted successfully", 
        data: template 
    });
});

// Get a template by ID
const getTemplateById = asyncHandler(async (req, res) => {
    const templateId = req.params.id;
    const template = await templateService.getTemplateById(templateId, req.user._id);
    res.status(200).json({ 
        success: true,
        message: "Template retrieved successfully", 
        data: template 
    });
});

// Get all templates for a user
const getTemplatesByUserId = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const templates = await templateService.getUserTemplates(userId);
    res.status(200).json({ 
        success: true,
        message: "Templates retrieved successfully", 
        data: templates 
    });
});

// Get all templates
const getAllTemplates = asyncHandler(async (req, res) => {
    const templates = await templateService.getTemplates(req.user._id);
    res.status(200).json({ 
        success: true,
        message: "All templates retrieved successfully", 
        data: templates 
    });
});

module.exports = {
    addTemplate,
    updateTemplate,
    deleteTemplate,
    getTemplateById,
    getTemplatesByUserId,
    getAllTemplates
};
