const Template = require('../models/Template');
const { checkPermission } = require('../utils/permissions');
const User = require('../models/User');
const { ApiError } = require('../middleware/errorHandler');

class TemplateService {
    async createTemplate(userId, templateData) {
        try {
            const template = new Template({
                ...templateData,
                userId,
                status: 'pending'
            });

            await template.save();
            return template;
        } catch (error) {
            if (error.code === 11000) {
                throw new ApiError(400, 'Template with this name and language already exists');
            }
            throw error;
        }
    }

    async getTemplates(userId, filters = {}) {
        try {
            const query = { userId: userId };
            if (filters.category) {
                query.category = filters.category;
            }
            if (filters.language) {
                query.language = filters.language;
            }

            const templates = await Template.find(query)
                .sort({ createdAt: -1 });

            return templates;
        } catch (error) {
            throw new Error(`Failed to get templates: ${error.message}`);
        }
    }

    async getTemplateById(templateId, userId) {
        try {
            const template = await Template.findOne({
                _id: templateId,
                userId: userId
            });

            if (!template) {
                throw new ApiError(404, 'Template not found');
            }

            return template;
        } catch (error) {
            throw new Error(`Failed to get template: ${error.message}`);
        }
    }

    async updateTemplate(templateId, userId, templateData) {
        const template = await Template.findOne({ _id: templateId, userId });
        
        if (!template) {
            throw new ApiError(404, 'Template not found');
        }

        // Only allow updates if template is pending or rejected
        if (template.status === 'approved') {
            throw new ApiError(400, 'Cannot update an approved template');
        }

        Object.assign(template, templateData);
        await template.save();
        
        return template;
    }

    async deleteTemplate(templateId, userId) {
        const template = await Template.findOne({ _id: templateId, userId });
        
        if (!template) {
            throw new ApiError(404, 'Template not found');
        }

        // Only allow deletion if template is pending or rejected
        if (template.status === 'approved') {
            throw new ApiError(400, 'Cannot delete an approved template');
        }

        await Template.deleteOne({ _id: templateId });
        
        return {
            message: 'Template deleted successfully'
        };
    }

    async approveTemplate(templateId, approverId) {
        const template = await Template.findById(templateId);
        
        if (!template) {
            throw new ApiError(404, 'Template not found');
        }

        if (template.status === 'approved') {
            throw new ApiError(400, 'Template is already approved');
        }

        template.status = 'approved';
        template.metadata.approvedBy = approverId;
        template.metadata.approvedAt = new Date();
        
        await template.save();
        
        return template;
    }

    async processTemplate(template, variables) {
        let content = template.content;
        for (const [key, value] of Object.entries(variables)) {
            content = content.replace(`{{${key}}}`, value);
        }
        return content;
    }

    async rejectTemplate(templateId, approverId, reason) {
        const template = await Template.findById(templateId);
        
        if (!template) {
            throw new ApiError(404, 'Template not found');
        }

        if (template.status === 'rejected') {
            throw new ApiError(400, 'Template is already rejected');
        }

        template.status = 'rejected';
        template.metadata.rejectionReason = reason;
        
        await template.save();
        
        return template;
    }

    async getUserTemplates(userId, filters = {}) {
        const query = { userId };
        
        // Apply filters
        if (filters.status) {
            query.status = filters.status;
        }
        if (filters.category) {
            query.category = filters.category;
        }
        if (filters.language) {
            query.language = filters.language;
        }

        const templates = await Template.find(query)
            .sort({ createdAt: -1 });
        
        return templates;
    }

    async getPendingTemplates() {
        const templates = await Template.find({ status: 'pending' })
            .populate('userId', 'username email')
            .sort({ createdAt: -1 });
        
        return templates;
    }

    async validateTemplate(templateData) {
        try {
            // Check required fields
            if (!templateData.name || !templateData.components || !templateData.category || !templateData.language) {
                throw new Error('Missing required fields: name, components, category, and language are required');
            }

            // Validate template name format (WhatsApp requirements)
            if (!/^[a-zA-Z0-9_-]+$/.test(templateData.name)) {
                throw new Error('Template name can only contain letters, numbers, underscores, and hyphens');
            }

            // Validate category (WhatsApp requirements)
            const validCategories = ['MARKETING', 'UTILITY', 'AUTHENTICATION'];
            if (!validCategories.includes(templateData.category)) {
                throw new Error(`Invalid category. Must be one of: ${validCategories.join(', ')}`);
            }

            // Validate components
            if (!Array.isArray(templateData.components) || templateData.components.length === 0) {
                throw new Error('Template must have at least one component');
            }

            // Validate each component
            for (const component of templateData.components) {
                // Validate component type
                const validTypes = ['HEADER', 'BODY', 'FOOTER', 'BUTTONS'];
                if (!validTypes.includes(component.type)) {
                    throw new Error(`Invalid component type. Must be one of: ${validTypes.join(', ')}`);
                }

                // Validate header format
                if (component.type === 'HEADER') {
                    const validFormats = ['TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT'];
                    if (!validFormats.includes(component.format)) {
                        throw new Error(`Invalid header format. Must be one of: ${validFormats.join(', ')}`);
                    }
                }

                // Validate text content
                if (component.type === 'BODY' || (component.type === 'HEADER' && component.format === 'TEXT')) {
                    if (!component.text) {
                        throw new Error(`${component.type} component must have text content`);
                    }
                    if (component.text.length > 1024) {
                        throw new Error(`${component.type} text exceeds maximum length of 1024 characters`);
                    }
                }

                // Validate buttons
                if (component.type === 'BUTTONS') {
                    if (!component.buttons || !Array.isArray(component.buttons) || component.buttons.length === 0) {
                        throw new Error('Buttons component must have at least one button');
                    }
                    if (component.buttons.length > 10) {
                        throw new Error('Maximum 10 buttons allowed per template');
                    }

                    for (const button of component.buttons) {
                        const validButtonTypes = ['QUICK_REPLY', 'URL', 'PHONE_NUMBER', 'COPY_CODE'];
                        if (!validButtonTypes.includes(button.type)) {
                            throw new Error(`Invalid button type. Must be one of: ${validButtonTypes.join(', ')}`);
                        }
                        if (!button.text) {
                            throw new Error('Button must have text content');
                        }
                        if (button.text.length > 25) {
                            throw new Error('Button text exceeds maximum length of 25 characters');
                        }
                        if (button.type === 'URL' && !button.url) {
                            throw new Error('URL button must have a URL');
                        }
                        if (button.type === 'PHONE_NUMBER' && !button.phoneNumber) {
                            throw new Error('Phone number button must have a phone number');
                        }
                    }
                }
            }

            return true;
        } catch (error) {
            throw new Error(`Template validation failed: ${error.message}`);
        }
    }

    async formatTemplateForWhatsApp(templateId) {
        const template = await Template.findById(templateId);
        
        if (!template) {
            throw new ApiError(404, 'Template not found');
        }

        if (template.status !== 'approved') {
            throw new ApiError(400, 'Template must be approved before sending');
        }

        return template.formatForWhatsApp();
    }
}

module.exports = new TemplateService(); 