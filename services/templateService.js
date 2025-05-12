const Template = require('../models/Template');
const { checkPermission } = require('../utils/permissions');
const User = require('../models/User');

class TemplateService {
    async createTemplate(userId, templateData) {
        try {
            const template = new Template({
                ...templateData,
                userId: userId
            });

            await template.save();
            return template;
        } catch (error) {
            throw new Error(`Failed to create template: ${error.message}`);
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
                throw new Error('Template not found');
            }

            return template;
        } catch (error) {
            throw new Error(`Failed to get template: ${error.message}`);
        }
    }

    async updateTemplate(templateId, userId, updateData) {
        try {
            const template = await Template.findOneAndUpdate(
                { _id: templateId, userId: userId },
                updateData,
                { new: true }
            );

            if (!template) {
                throw new Error('Template not found');
            }

            return template;
        } catch (error) {
            throw new Error(`Failed to update template: ${error.message}`);
        }
    }

    async deleteTemplate(templateId, userId) {
        try {
            const template = await Template.findOneAndDelete({
                _id: templateId,
                userId: userId
            });

            if (!template) {
                throw new Error('Template not found');
            }

            return template;
        } catch (error) {
            throw new Error(`Failed to delete template: ${error.message}`);
        }
    }

    async approveTemplate(templateId, adminId) {
        try {
            const admin = await User.findById(adminId);
            if (!admin) {
                throw new Error('Admin not found');
            }

            const hasPermission = await checkPermission(admin, 'approve_templates');
            if (!hasPermission) {
                throw new Error('Unauthorized to approve templates');
            }

            const template = await Template.findByIdAndUpdate(
                templateId,
                { 
                    status: 'approved',
                    approvedBy: adminId,
                    approvedAt: new Date()
                },
                { new: true }
            );

            if (!template) {
                throw new Error('Template not found');
            }

            return template;
        } catch (error) {
            throw new Error(`Failed to approve template: ${error.message}`);
        }
    }

    async processTemplate(template, variables) {
        let content = template.content;
        for (const [key, value] of Object.entries(variables)) {
            content = content.replace(`{{${key}}}`, value);
        }
        return content;
    }

    async rejectTemplate(templateId, userId, rejectionReason) {
        return await Template.findByIdAndUpdate(
            templateId,
            {
                status: 'rejected',
                'metadata.rejectionReason': rejectionReason
            },
            { new: true }
        );
    }

    async getUserTemplates(userId, filters = {}) {
        try {
            const query = { userId, ...filters };
            const templates = await Template.find(query).sort({ createdAt: -1 });
            return templates;
        } catch (error) {
            throw new Error(`Failed to get templates: ${error.message}`);
        }
    }

    async getPendingTemplates() {
        try {
            const templates = await Template.find({ status: 'pending' })
                .sort({ createdAt: -1 })
                .populate('userId', 'username email');
            return templates;
        } catch (error) {
            throw new Error(`Failed to get pending templates: ${error.message}`);
        }
    }

    async validateTemplate(templateData) {
        try {
            // Check required fields
            if (!templateData.name || !templateData.content || !templateData.category || !templateData.language) {
                throw new Error('Missing required fields');
            }

            // Validate template name format
            if (!/^[a-zA-Z0-9_-]+$/.test(templateData.name)) {
                throw new Error('Template name can only contain letters, numbers, underscores, and hyphens');
            }

            // Validate content length
            if (templateData.content.length > 4096) {
                throw new Error('Template content exceeds maximum length of 4096 characters');
            }

            // Validate variables format
            if (templateData.variables && Array.isArray(templateData.variables)) {
                for (const variable of templateData.variables) {
                    if (!variable.name || typeof variable.name !== 'string') {
                        throw new Error('Variable name is required and must be a string');
                    }
                    if (!/^[a-zA-Z0-9_]+$/.test(variable.name)) {
                        throw new Error('Variable name can only contain letters, numbers, and underscores');
                    }
                    if (variable.required !== undefined && typeof variable.required !== 'boolean') {
                        throw new Error('Variable required property must be a boolean');
                    }
                    if (variable.type && !['string', 'number', 'date', 'currency'].includes(variable.type)) {
                        throw new Error('Invalid variable type. Must be one of: string, number, date, currency');
                    }
                }
            }

            return true;
        } catch (error) {
            throw new Error(`Template validation failed: ${error.message}`);
        }
    }
}

module.exports = new TemplateService(); 