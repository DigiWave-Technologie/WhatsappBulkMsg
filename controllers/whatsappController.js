const whatsappService = require('../services/whatsappService');
const { asyncHandler } = require('../middleware/errorHandler');
const { validatePhoneNumber } = require('../utils/helpers');

// Send a WhatsApp message
const sendMessage = asyncHandler(async (req, res) => {
    const { to, message, media } = req.body;

    if (!to || !message) {
        return res.status(400).json({
            success: false,
            message: 'Recipient number and message are required'
        });
    }

    const result = await whatsappService.sendMessage(to, message, media);

    res.status(200).json({
        success: true,
        message: 'Message sent successfully',
        data: result
    });
});

// Send a template message
const sendTemplate = asyncHandler(async (req, res) => {
    const { to, templateName, language, components } = req.body;

    if (!to || !templateName || !language) {
        return res.status(400).json({
            success: false,
            message: 'Recipient number, template name, and language are required'
        });
    }

    const result = await whatsappService.sendTemplate(to, templateName, language, components);

    res.status(200).json({
        success: true,
        message: 'Template message sent successfully',
        data: result
    });
});

// Get message status
const getMessageStatus = asyncHandler(async (req, res) => {
    const { messageId } = req.params;

    if (!messageId) {
        return res.status(400).json({
            success: false,
            message: 'Message ID is required'
        });
    }

    const result = await whatsappService.getMessageStatus(messageId);

    res.status(200).json({
        success: true,
        data: result
    });
});

// Validate a WhatsApp number
const validateNumber = asyncHandler(async (req, res) => {
    const { phoneNumber } = req.params;

    if (!phoneNumber) {
        return res.status(400).json({
            success: false,
            message: 'Phone number is required'
        });
    }

    const result = await whatsappService.validateNumber(phoneNumber);

    res.status(200).json({
        success: true,
        data: result
    });
});

// Get business profile
const getBusinessProfile = asyncHandler(async (req, res) => {
    const result = await whatsappService.getBusinessProfile();

    res.status(200).json({
        success: true,
        data: result
    });
});

// Update business profile
const updateBusinessProfile = asyncHandler(async (req, res) => {
    const profile = req.body;

    if (!profile) {
        return res.status(400).json({
            success: false,
            message: 'Profile data is required'
        });
    }

    const result = await whatsappService.updateBusinessProfile(profile);

    res.status(200).json({
        success: true,
        message: 'Business profile updated successfully',
        data: result
    });
});

module.exports = {
    sendMessage,
    sendTemplate,
    getMessageStatus,
    validateNumber,
    getBusinessProfile,
    updateBusinessProfile
}; 