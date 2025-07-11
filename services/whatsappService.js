const axios = require('axios');
const { ApiError } = require('../utils/ApiError');
const config = require('../config/config');
const WhatsAppConfig = require('../models/WhatsAppConfig');
const MessageLog = require('../models/MessageLog');
const logger = require('../utils/logger');
const appConfig = require('../config/config');
const mongoose = require('mongoose');
const User = require('../models/User');
const { Credit, CreditTransaction } = require('../models/Credit');
const Category = require('../models/Category');

class WhatsAppService {
    constructor() {
        this.dummyMode = false;
    }

    // Initialize WAAPI client
    async initWaapiClient(apiKey) {
        this.waapiKey = apiKey || 'dummy_api_key';
    }

    // Get WhatsApp configuration by phone number
    async getWhatsAppConfigByPhoneNumber(userId, phoneNumber) {
        try {
            const config = await WhatsAppConfig.findOne({
                userId,
                phoneNumber,
                is_active: true
            });

            if (!config) {
                throw new ApiError(404, `WhatsApp configuration not found for phone number: ${phoneNumber}`);
            }

            return config;
        } catch (error) {
            logger.error('Error fetching WhatsApp configuration:', error);
            throw error;
        }
    }

    // Get all active WhatsApp configurations for a user
    async getAllWhatsAppConfigs(userId) {
        try {
            const configs = await WhatsAppConfig.find({
                userId,
                is_active: true
            }).select('phoneNumber name description is_default');

            return configs;
        } catch (error) {
            logger.error('Error fetching WhatsApp configurations:', error);
            throw error;
        }
    }

    // Send message using Meta Cloud API
    async sendMetaMessage(to, message, phoneNumberId, accessToken) {
        try {
            const url = `${appConfig.whatsapp.apiUrl}/${phoneNumberId}/messages`;
            const headers = {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            };

            logger.info(`Sending Meta message to: ${url}`);
            logger.info(`Authorization header: ${headers.Authorization}`);

            const response = await axios.post(
                url,
                {
                    messaging_product: 'whatsapp',
                    to,
                    ...message
                },
                {
                    headers
                }
            );
            return response.data;
        } catch (error) {
            throw new ApiError(500, `Meta API Error: ${error.message}`);
        }
    }

    // Send message using WAAPI
    async sendWaapiMessage(to, message) {
        try {
            if (this.dummyMode) {
                // Return dummy response
                return {
                    success: true,
                    messageId: `dummy_waapi_${Date.now()}`,
                    status: 'sent'
                };
            }

            const response = await axios.post(
                `${this.waapiUrl}/messages`,
                {
                    to,
                    ...message
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.waapiKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            return response.data;
        } catch (error) {
            if (this.dummyMode) {
                // Return dummy success response in dummy mode
                return {
                    success: true,
                    messageId: `dummy_waapi_${Date.now()}`,
                    status: 'sent'
                };
            }
            throw new ApiError(500, `WAAPI Error: ${error.message}`);
        }
    }

    // Send Quick Campaign Message
    async sendQuickMessage(to, text, media = null, userId) {
        const config = await this.getWhatsAppConfig(userId);
        if (!config) {
            throw new Error('WhatsApp configuration not found');
        }

        const message = {
            type: 'text',
            text: { body: text }
        };

        if (media) {
            message.type = media.type;
            message[media.type] = {
                link: media.url,
                caption: media.caption
            };
        }

        return this.sendMetaMessage(to, message, config.phoneNumberId, config.accessToken);
    }

    // Send Button Campaign Message
    async sendButtonMessage(to, text, buttons, userId) {
        const config = await this.getWhatsAppConfig(userId);
        if (!config) {
            throw new Error('WhatsApp configuration not found');
        }

        const message = {
            type: 'interactive',
            interactive: {
                type: 'button',
                body: {
                    text
                },
                action: {
                    buttons: buttons.map((btn, index) => ({
                        type: btn.type,
                        reply: {
                            id: `btn_${index}`,
                            title: btn.text
                        }
                    }))
                }
            }
        };

        return this.sendMetaMessage(to, message, config.phoneNumberId, config.accessToken);
    }

    // Send DP (Display Picture) Campaign Message
    async sendDPMessage(to, imageUrl, caption = '', userId) {
        const config = await this.getWhatsAppConfig(userId);
        if (!config) {
            throw new Error('WhatsApp configuration not found');
        }

        const message = {
            type: 'image',
            image: {
                link: imageUrl,
                caption
            }
        };

        return this.sendMetaMessage(to, message, config.phoneNumberId, config.accessToken);
    }

    // Send Poll Campaign Message
    async sendPollMessage(to, question, options, userId) {
        const config = await this.getWhatsAppConfig(userId);
        if (!config) {
            throw new Error('WhatsApp configuration not found');
        }

        const message = {
            type: 'interactive',
            interactive: {
                type: 'poll',
                poll: {
                    question,
                    options: options.map((opt, index) => ({
                        id: `opt_${index}`,
                        text: opt
                    }))
                }
            }
        };

        return this.sendMetaMessage(to, message, config.phoneNumberId, config.accessToken);
    }

    // Send Group Campaign Message
    async sendGroupMessage(groupId, message, userId) {
        const config = await this.getWhatsAppConfig(userId);
        if (!config) {
            throw new Error('WhatsApp configuration not found');
        }
        // Note: This requires special permissions and approval from WhatsApp
        const response = await axios.post(
            `${appConfig.whatsapp.apiUrl}/${config.phoneNumberId}/messages`,
            {
                messaging_product: 'whatsapp',
                recipient_type: 'group',
                to: groupId,
                ...message
            },
            {
                headers: {
                    'Authorization': `Bearer ${config.accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        return response.data;
    }

    // Send Template Message
    async sendTemplateMessage(to, templateName, languageCode, components = [], userId) {
        const config = await this.getWhatsAppConfig(userId);
        if (!config) {
            throw new Error('WhatsApp configuration not found');
        }

        const message = {
            type: 'template',
            template: {
                name: templateName,
                language: {
                    code: languageCode
                }
            }
        };

        if (components && components.length > 0) {
            message.template.components = components;
        }

        return this.sendMetaMessage(to, message, config.phoneNumberId, config.accessToken);
    }

    // Handle message status updates
    async handleStatusUpdate(webhookData) {
        const { status, messageId, timestamp } = webhookData;
        // Update campaign stats based on status
        return {
            status,
            messageId,
            timestamp
        };
    }

    async getWhatsAppConfig(userId) {
        if (this.dummyMode) {
            return {
                phoneNumberId: 'dummy_phone_id',
                accessToken: 'dummy_access_token',
                whatsappBusinessAccountId: 'dummy_business_id'
            };
        }
        return await WhatsAppConfig.findOne({ userId, isActive: true });
    }

    async sendMessage(userId, to, templateName, languageCode, components) {
        try {
            const config = await this.getWhatsAppConfig(userId);
            if (!config && !this.dummyMode) {
                throw new Error('WhatsApp configuration not found');
            }

            if (this.dummyMode) {
                // Log dummy message
                await MessageLog.create({
                    userId,
                    recipient: to,
                    messageType: 'template',
                    content: {
                        templateName,
                        languageCode,
                        components
                    },
                    status: 'sent',
                    messageId: `dummy_msg_${Date.now()}`
                });

                return {
                    messaging_product: 'whatsapp',
                    contacts: [{ input: to, wa_id: 'dummy_wa_id' }],
                    messages: [{ id: `dummy_msg_${Date.now()}` }]
                };
            }

            const url = `${appConfig.whatsapp.apiUrl}/${config.phoneNumberId}/messages`;
            const headers = {
                'Authorization': `Bearer ${config.accessToken}`,
                'Content-Type': 'application/json'
            };

            logger.info(`Sending Meta message to: ${url}`);
            logger.info(`Authorization header: ${headers.Authorization}`);

            const data = {
                messaging_product: "whatsapp",
                    to: to,
                type: "template",
                    template: {
                        name: templateName,
                        language: {
                            code: languageCode
                    }
                }
            };

            if (components && components.length > 0) {
                data.template.components = components;
                    }

            logger.info(`Request data: ${JSON.stringify(data, null, 2)}`);

            const response = await axios.post(url, data, { headers });
            return response.data;
        } catch (error) {
            logger.error(`Error sending message: ${error.message}`);
            if (error.response) {
                logger.error(`Error response: ${JSON.stringify(error.response.data, null, 2)}`);
            }
            throw new ApiError(500, `Error sending message: ${error.message}`);
        }
    }

    async getTemplates(userId) {
        try {
            const config = await this.getWhatsAppConfig(userId);
            if (!config) {
                throw new Error('WhatsApp configuration not found');
            }

            const url = `${appConfig.whatsapp.apiUrl}/${config.whatsappBusinessAccountId}/message_templates`;
            const headers = {
                'Authorization': `Bearer ${config.accessToken}`
            };

            const response = await axios.get(url, { headers });
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    async createTemplate(userId, templateData) {
        try {
            const config = await this.getWhatsAppConfig(userId);
            if (!config) {
                throw new Error('WhatsApp configuration not found');
            }

            const url = `${appConfig.whatsapp.apiUrl}/${config.whatsappBusinessAccountId}/message_templates`;
            const headers = {
                'Authorization': `Bearer ${config.accessToken}`,
                    'Content-Type': 'application/json'
            };

            const response = await axios.post(url, templateData, { headers });
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    // Send List Campaign Message
    async sendListMessage(to, text, buttonText, sections, userId) {
        const config = await this.getWhatsAppConfig(userId);
        if (!config) {
            throw new Error('WhatsApp configuration not found');
        }

        const message = {
            type: 'interactive',
            interactive: {
                type: 'list',
                body: {
                    text
                },
                action: {
                    button: buttonText,
                    sections: sections.map(section => ({
                        title: section.title,
                        rows: section.items.map((item, index) => ({
                            id: `item_${index}`,
                            title: item.title,
                            description: item.description
                        }))
                    }))
                }
            }
        };

        return this.sendMetaMessage(to, message, config.phoneNumberId, config.accessToken);
    }

    // Send Location Campaign Message
    async sendLocationMessage(to, latitude, longitude, name, address, userId) {
        const config = await this.getWhatsAppConfig(userId);
        if (!config) {
            throw new Error('WhatsApp configuration not found');
        }

        const message = {
            type: 'location',
            location: {
                latitude,
                longitude,
                name,
                address
            }
        };

        return this.sendMetaMessage(to, message, config.phoneNumberId, config.accessToken);
    }

    // Send Contact Campaign Message
    async sendContactMessage(to, contacts, userId) {
        const config = await this.getWhatsAppConfig(userId);
        if (!config) {
            throw new Error('WhatsApp configuration not found');
        }

        const message = {
            type: 'contacts',
            contacts: contacts.map(contact => ({
                name: {
                    formatted_name: contact.name,
                    first_name: contact.firstName,
                    last_name: contact.lastName
                },
                phones: contact.phones.map(phone => ({
                    phone: phone.number,
                    type: phone.type,
                    wa_id: phone.waId
                }))
            }))
        };

        return this.sendMetaMessage(to, message, config.phoneNumberId, config.accessToken);
    }

    // Send Reaction Campaign Message
    async sendReactionMessage(to, messageId, emoji, userId) {
        const config = await this.getWhatsAppConfig(userId);
        if (!config) {
            throw new Error('WhatsApp configuration not found');
        }

        const message = {
            type: 'reaction',
            reaction: {
                message_id: messageId,
                emoji
            }
        };

        return this.sendMetaMessage(to, message, config.phoneNumberId, config.accessToken);
    }

    // Send Order Campaign Message
    async sendOrderMessage(to, orderId, orderItems, orderTotal, userId) {
        const config = await this.getWhatsAppConfig(userId);
        if (!config) {
            throw new Error('WhatsApp configuration not found');
        }

        const message = {
            type: 'order',
            order: {
                catalog_id: orderId,
                product_items: orderItems.map(item => ({
                    product_retailer_id: item.id,
                    quantity: item.quantity,
                    item_price: item.price,
                    currency: item.currency
                })),
                order_total: {
                    value: orderTotal.value,
                    currency: orderTotal.currency
                }
            }
        };

        return this.sendMetaMessage(to, message, config.phoneNumberId, config.accessToken);
    }

    // Send Interactive Campaign Message (Combined)
    async sendInteractiveMessage(to, type, data, userId) {
        const config = await this.getWhatsAppConfig(userId);
        if (!config) {
            throw new Error('WhatsApp configuration not found');
        }

        const message = {
            type: 'interactive',
            interactive: {
                type,
                ...data
            }
        };

        return this.sendMetaMessage(to, message, config.phoneNumberId, config.accessToken);
    }

    // Send Media Campaign Message with Progress
    async sendMediaMessageWithProgress(to, mediaType, mediaUrl, caption, onProgress, userId) {
        const config = await this.getWhatsAppConfig(userId);
        if (!config) {
            throw new Error('WhatsApp configuration not found');
        }

        const message = {
            type: mediaType,
            [mediaType]: {
                link: mediaUrl,
                caption
            }
        };

        try {
            const response = await axios.post(
                `${appConfig.whatsapp.apiUrl}/${config.phoneNumberId}/messages`,
                {
                    messaging_product: 'whatsapp',
                    recipient_type: 'individual',
                    to,
                    ...message
                },
                {
                    headers: {
                        'Authorization': `Bearer ${config.accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    onUploadProgress: progressEvent => {
                        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        onProgress(percentCompleted);
                    }
                }
            );
            return response.data;
        } catch (error) {
            throw new ApiError(500, `Media Upload Error: ${error.message}`);
        }
    }

    // Send Bulk Messages with Rate Limiting
    async sendBulkMessages(recipients, message, options = {}, userId) {
        const config = await this.getWhatsAppConfig(userId);
        if (!config) {
            throw new Error('WhatsApp configuration not found');
        }

        const {
            batchSize = 50,
            delayBetweenBatches = 1000,
            maxRetries = 3,
            retryDelay = 5000
        } = options;

        const batches = [];
        for (let i = 0; i < recipients.length; i += batchSize) {
            batches.push(recipients.slice(i, i + batchSize));
        }

        const results = [];
        for (const batch of batches) {
            const batchPromises = batch.map(async recipient => {
                let retries = 0;
                while (retries < maxRetries) {
                    try {
                        const result = await this.sendMetaMessage(recipient, message, config.phoneNumberId, config.accessToken);
                        results.push({ recipient, success: true, data: result });
                        break;
                    } catch (error) {
                        retries++;
                        if (retries === maxRetries) {
                            results.push({ recipient, success: false, error: error.message });
                        } else {
                            await new Promise(resolve => setTimeout(resolve, retryDelay));
                        }
                    }
                }
            });

            await Promise.all(batchPromises);
            await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
        }

        return results;
    }

    // Send message with credit deduction in transaction
    async sendMessageWithCreditDeduction(userId, to, message, creditType = 'virtual_credit') {
        let user = null;
        let category = null;
        try {
            user = await User.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            // Skip credit check for super admin
            if (user.role !== 'super_admin') {
                // Get category by name
                category = await Category.findOne({ name: creditType });
                if (!category) {
                    throw new Error(`Credit category '${creditType}' not found`);
                }

                // Check if category is active
                if (!category.isActive) {
                    throw new Error(`Credit category '${creditType}' is not active`);
                }

                // Check credits
                const credit = await Credit.findOne({ 
                    userId, 
                    categoryId: category._id 
                });

                if (!credit) {
                    throw new Error(`No credits found for category '${creditType}'. Please purchase credits first.`);
                }

                if (!credit.isUnlimited && credit.credit < category.creditCost) {
                    throw new Error(`Insufficient credits for category '${creditType}'. Required: ${category.creditCost}, Available: ${credit.credit}`);
                }

                // Deduct credit if not unlimited
                if (!credit.isUnlimited) {
                    credit.credit -= category.creditCost;
                    credit.lastUsed = new Date();
                    await credit.save();

                    // Log transaction
                    await CreditTransaction.create({
                        fromUserId: userId,
                        toUserId: userId,
                        categoryId: category._id,
                        creditType: 'debit',
                        credit: category.creditCost,
                        description: `Credit deduction for WhatsApp message (${creditType})`
                    });
                }
            }

            // Get WhatsApp config
            const config = await this.getWhatsAppConfig(userId);
            if (!config) {
                throw new Error('WhatsApp configuration not found');
            }

            // Send message
            const response = await this.sendMetaMessage(to, message, config.phoneNumberId, config.accessToken);

            // Log message
            await MessageLog.create({
                userId,
                recipient: to,
                messageType: message.type || 'text',
                content: message.text?.body || message.template?.name || 'N/A',
                status: 'sent',
                messageId: response.messages?.[0]?.id,
                categoryId: category?._id,
                creditCost: category?.creditCost
            });

            return response;

        } catch (error) {
            // If message send failed, try to refund the credit
            if (error.message.includes('Meta API Error') && user && user.role !== 'super_admin') {
                try {
                    if (category) {
                        const credit = await Credit.findOne({ 
                            userId, 
                            categoryId: category._id 
                        });
                        
                        if (credit && !credit.isUnlimited) {
                            credit.credit += category.creditCost;
                            await credit.save();

                            await CreditTransaction.create({
                                fromUserId: userId,
                                toUserId: userId,
                                categoryId: category._id,
                                creditType: 'credit',
                                credit: category.creditCost,
                                description: `Credit refund due to failed message send (${creditType})`
                            });
                        }
                    }
                } catch (refundError) {
                    logger.error('Failed to refund credit:', refundError);
                }
            }
            throw error;
        }
    }

    // Send message using specific phone number configuration
    async sendMessageWithPhoneNumber(userId, to, message, phoneNumber, category = 'virtual_credit') {
        try {
            // Get configuration for the specified phone number
            const config = await this.getWhatsAppConfigByPhoneNumber(userId, phoneNumber);
            if (!config) {
                throw new Error('WhatsApp configuration not found for the specified phone number');
            }

            // Deduct credits
            const creditDeduction = await this.deductCredits(userId, category);
            if (!creditDeduction.success) {
                throw new Error(creditDeduction.message);
            }

            // Build the payload for template message if type is template
            let data = message;
            if (message.type === 'template') {
                data = {
                    messaging_product: 'whatsapp',
                    to: to,
                    type: 'template',
                    template: message.template
                };
            }

            // Send message using Meta Cloud API
            const url = `https://graph.facebook.com/v22.0/${config.phoneNumberId}/messages`;
            const headers = {
                'Authorization': `Bearer ${config.accessToken}`,
                'Content-Type': 'application/json'
            };
            let response;
            try {
                response = await axios.post(url, data, { headers });
            } catch (error) {
                // Forward the error response from Facebook API
                if (error.response) {
                    throw new Error(JSON.stringify(error.response.data));
                } else {
                    throw error;
                }
            }

            // Log the message
            await MessageLog.create({
                userId,
                recipient: to,
                messageType: message.type || 'template',
                content: message.template?.name || message.text?.body || JSON.stringify(message),
                status: 'sent',
                messageId: response.data?.messages?.[0]?.id || null,
                phoneNumber: config.phoneNumber,
                category
            });

            return {
                success: true,
                data: response.data,
                creditDeduction
            };
        } catch (error) {
            logger.error('Error sending message:', error);
            // Forward the error message
            throw error;
        }
    }

    // Send template message with specific phone number
    async sendTemplateMessageWithPhoneNumber(userId, to, templateName, languageCode, components = [], phoneNumber, category = 'virtual_credit') {
        try {
            const config = await this.getWhatsAppConfigByPhoneNumber(userId, phoneNumber);
            if (!config) {
                throw new Error('WhatsApp configuration not found for the specified phone number');
            }

            const message = {
                type: 'template',
                template: {
                    name: templateName,
                    language: {
                        code: languageCode
                    }
                }
            };

            if (components && components.length > 0) {
                message.template.components = components;
            }

            // Use the improved sendMessageWithPhoneNumber
            return await this.sendMessageWithPhoneNumber(userId, to, message, phoneNumber, category);
        } catch (error) {
            logger.error('Error sending template message:', error);
            throw error;
        }
    }

    // Deduct credits for message sending
    async deductCredits(userId, category) {
        try {
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            // Find the category by name or ID
            let categoryDoc;
            if (mongoose.Types.ObjectId.isValid(category)) {
                categoryDoc = await Category.findById(category);
            } else {
                categoryDoc = await Category.findOne({ name: category });
            }

            if (!categoryDoc) {
                throw new Error(`Category '${category}' not found`);
            }

            // Find credit by userId and categoryId
            const credit = await Credit.findOne({
                userId,
                categoryId: categoryDoc._id
            });

            logger.info(`Credit check for user ${userId}, category ${categoryDoc.name} (${categoryDoc._id}):`, {
                creditFound: !!credit,
                isUnlimited: credit?.isUnlimited,
                creditAmount: credit?.credit
            });

            if (!credit) {
                throw new Error(`No credits found for category '${categoryDoc.name}'. Please purchase credits first.`);
            }

            if (!credit.isUnlimited && credit.credit <= 0) {
                throw new Error(`Insufficient credits for category '${categoryDoc.name}'. Required: 1, Available: ${credit.credit}`);
            }

            // Only deduct credits if not unlimited
            if (!credit.isUnlimited) {
                credit.credit -= 1;
                await credit.save();
            }

            // Log credit transaction only if credits were actually deducted
            if (!credit.isUnlimited) {
                await CreditTransaction.create({
                    fromUserId: userId,
                    toUserId: userId,
                    categoryId: categoryDoc._id,
                    creditType: 'debit',
                    credit: 1,
                    description: 'Message sent'
                });
            }

            return {
                success: true,
                remainingCredits: credit.credit
            };
        } catch (error) {
            logger.error('Error deducting credits:', error);
            return {
                success: false,
                message: error.message
            };
        }
    }
}

module.exports = new WhatsAppService(); 