const whatsappService = require('../services/whatsappService');
const WhatsAppConfig = require('../models/WhatsAppConfig');
const { validateObjectId, validatePhoneNumber } = require('../utils/validators');
const { ApiError } = require('../utils/ApiError');
const logger = require('../utils/logger');

// Get all WhatsApp configurations for the user
exports.getWhatsAppConfigs = async (req, res) => {
    try {
        const userId = req.user.userId;
        const configs = await whatsappService.getAllWhatsAppConfigs(userId);

        res.status(200).json({
            success: true,
            data: configs
        });
    } catch (error) {
        logger.error('Error fetching WhatsApp configurations:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Configure WhatsApp
exports.configureWhatsApp = async (req, res) => {
    try {
        const { phoneNumber, whatsappBusinessAccountId, phoneNumberId, accessToken, name, description } = req.body;
        const userId = req.user.userId;

        // Validate required fields
        if (!phoneNumber || !whatsappBusinessAccountId || !phoneNumberId || !accessToken) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Validate phone number format
        if (!validatePhoneNumber(phoneNumber)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid phone number format'
            });
        }

        // Check if configuration already exists for this phone number
        let config = await WhatsAppConfig.findOne({ userId, phoneNumber });
        
        if (config) {
            // Update existing configuration
            config.whatsappBusinessAccountId = whatsappBusinessAccountId;
            config.phoneNumberId = phoneNumberId;
            config.accessToken = accessToken;
            config.name = name || config.name;
            config.description = description || config.description;
            await config.save();
        } else {
            // Create new configuration
            config = await WhatsAppConfig.create({
                userId,
                phoneNumber,
                whatsappBusinessAccountId,
                phoneNumberId,
                accessToken,
                name,
                description,
                created_by: userId
            });
        }

        res.status(200).json({
            success: true,
            message: 'WhatsApp configuration saved successfully',
            data: config
        });
    } catch (error) {
        logger.error('Error configuring WhatsApp:', error);
        res.status(500).json({
            success: false,
            message: 'Error configuring WhatsApp',
            error: error.message
        });
    }
};

// Send message
exports.sendMessage = async (req, res) => {
    try {
        const { to, templateName, languageCode, components, category, phoneNumber } = req.body;
        const userId = req.user.userId;

        // Validate required fields
        if (!to || !templateName || !languageCode || !category || !phoneNumber) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: to, templateName, languageCode, category, and phoneNumber are required'
            });
        }

        // Send template message with selected phone number
        const result = await whatsappService.sendTemplateMessageWithPhoneNumber(
            userId,
            to,
            templateName,
            languageCode,
            components,
            phoneNumber
        );

        res.status(200).json({
            success: true,
            message: 'Message sent successfully',
            data: result
        });
    } catch (error) {
        logger.error('Error sending message:', error);
        res.status(500).json({
            success: false,
            message: 'Error sending message',
            error: error.message
        });
    }
};

// Update WhatsApp configuration
exports.updateWhatsAppConfig = async (req, res) => {
    try {
        const { phoneNumber, whatsappBusinessAccountId, phoneNumberId, accessToken, name, description, is_active, is_default } = req.body;
        const userId = req.user.userId;

        // Validate required fields
        if (!phoneNumber) {
            return res.status(400).json({
                success: false,
                message: 'Phone number is required'
            });
        }

        // Find configuration
        const config = await WhatsAppConfig.findOne({ userId, phoneNumber });
        
        if (!config) {
            return res.status(404).json({
                success: false,
                message: 'WhatsApp configuration not found'
            });
        }

        // Update fields
        if (whatsappBusinessAccountId) config.whatsappBusinessAccountId = whatsappBusinessAccountId;
        if (phoneNumberId) config.phoneNumberId = phoneNumberId;
        if (accessToken) config.accessToken = accessToken;
        if (name) config.name = name;
        if (description) config.description = description;
        if (is_active !== undefined) config.is_active = is_active;
        if (is_default !== undefined) config.is_default = is_default;
        config.updated_by = userId;

        await config.save();

        res.status(200).json({
            success: true,
            message: 'WhatsApp configuration updated successfully',
            data: config
        });
    } catch (error) {
        logger.error('Error updating WhatsApp configuration:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating WhatsApp configuration',
            error: error.message
        });
    }
};

// Delete WhatsApp configuration
exports.deleteWhatsAppConfig = async (req, res) => {
    try {
        const { phoneNumber } = req.params;
        const userId = req.user.userId;

        const config = await WhatsAppConfig.findOneAndDelete({ userId, phoneNumber });
        
        if (!config) {
            return res.status(404).json({
                success: false,
                message: 'WhatsApp configuration not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'WhatsApp configuration deleted successfully'
        });
    } catch (error) {
        logger.error('Error deleting WhatsApp configuration:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting WhatsApp configuration',
            error: error.message
        });
    }
};

module.exports.getWhatsAppConfig = async (req, res) => {
    try {
        const userId = req.user.userId;
        const config = await WhatsAppConfig.findOne({ userId });

        if (!config) {
            return res.status(404).json({
                success: false,
                message: 'WhatsApp configuration not found'
            });
        }

        res.status(200).json({
            success: true,
            data: config
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching WhatsApp configuration',
            error: error.message
        });
    }
};

module.exports.getTemplates = async (req, res) => {
    try {
        const userId = req.user.userId;
        const templates = await whatsappService.getTemplates(userId);

        res.status(200).json({
            success: true,
            data: templates
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching templates',
            error: error.message
        });
    }
};

module.exports.createTemplate = async (req, res) => {
    try {
        const userId = req.user.userId;
        const templateData = req.body;

        const result = await whatsappService.createTemplate(userId, templateData);

        res.status(200).json({
            success: true,
            message: 'Template created successfully',
            data: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating template',
            error: error.message
        });
    }
}; 