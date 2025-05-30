const whatsappService = require('../services/whatsappService');
const WhatsAppConfig = require('../models/WhatsAppConfig');
const { validateObjectId, validatePhoneNumber } = require('../utils/validators');

module.exports.configureWhatsApp = async (req, res) => {
    try {
        const { whatsappBusinessAccountId, phoneNumberId, accessToken } = req.body;
        const userId = req.user.userId;

        // Validate required fields
        if (!whatsappBusinessAccountId || !phoneNumberId || !accessToken) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Check if configuration already exists
        let config = await WhatsAppConfig.findOne({ userId });
        
        if (config) {
            // Update existing configuration
            config.whatsappBusinessAccountId = whatsappBusinessAccountId;
            config.phoneNumberId = phoneNumberId;
            config.accessToken = accessToken;
            await config.save();
        } else {
            // Create new configuration
            config = await WhatsAppConfig.create({
                userId,
                whatsappBusinessAccountId,
                phoneNumberId,
                accessToken
            });
        }

        res.status(200).json({
            success: true,
            message: 'WhatsApp configuration saved successfully',
            data: config
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error configuring WhatsApp',
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

module.exports.sendMessage = async (req, res) => {
    try {
        const { to, templateName, languageCode, components } = req.body;
        const userId = req.user.userId;

        // Validate required fields
        if (!to || !templateName || !languageCode) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Validate phone number
        if (!validatePhoneNumber(to)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid phone number format'
            });
        }

        const result = await whatsappService.sendMessage(
            userId,
            to,
            templateName,
            languageCode,
            components
        );

        res.status(200).json({
            success: true,
            message: 'Message sent successfully',
            data: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error sending message',
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

module.exports.updateWhatsAppConfig = async (req, res) => {
    try {
        const { whatsappBusinessAccountId, phoneNumberId, accessToken } = req.body;
        const userId = req.user.userId;

        // Validate required fields
        if (!whatsappBusinessAccountId || !phoneNumberId || !accessToken) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Find and update configuration
        const config = await WhatsAppConfig.findOne({ userId });
        
        if (!config) {
            return res.status(404).json({
                success: false,
                message: 'WhatsApp configuration not found'
            });
        }

        // Update fields
        config.whatsappBusinessAccountId = whatsappBusinessAccountId;
        config.phoneNumberId = phoneNumberId;
        config.accessToken = accessToken;
        await config.save();

        res.status(200).json({
            success: true,
            message: 'WhatsApp configuration updated successfully',
            data: config
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating WhatsApp configuration',
            error: error.message
        });
    }
};

module.exports.deleteWhatsAppConfig = async (req, res) => {
    try {
        const userId = req.user.userId;

        // Find and delete configuration
        const config = await WhatsAppConfig.findOneAndDelete({ userId });
        
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
        res.status(500).json({
            success: false,
            message: 'Error deleting WhatsApp configuration',
            error: error.message
        });
    }
};

module.exports.getAllWhatsAppConfigs = async (req, res) => {
    try {
        const userId = req.user.userId;
        
        // Get all configurations for the user
        const configs = await WhatsAppConfig.find({ userId });

        res.status(200).json({
            success: true,
            data: configs
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching WhatsApp configurations',
            error: error.message
        });
    }
}; 