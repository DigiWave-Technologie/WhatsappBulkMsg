const axios = require('axios');
const WhatsAppConfig = require('../models/WhatsAppConfig');
const MessageLog = require('../models/MessageLog');

class WhatsAppService {
    constructor() {
        this.baseUrl = 'https://graph.facebook.com/v17.0';
    }

    async getWhatsAppConfig(userId) {
        return await WhatsAppConfig.findOne({ userId, isActive: true });
    }

    async sendMessage(userId, to, templateName, languageCode, components) {
        try {
            const config = await this.getWhatsAppConfig(userId);
            if (!config) {
                throw new Error('WhatsApp configuration not found');
            }

            const url = `${this.baseUrl}/${config.phoneNumberId}/messages`;
            const headers = {
                'Authorization': `Bearer ${config.accessToken}`,
                'Content-Type': 'application/json'
            };

            const data = {
                messaging_product: "whatsapp",
                to: to,
                type: "template",
                template: {
                    name: templateName,
                    language: {
                        code: languageCode
                    },
                    components: components
                }
            };

            const response = await axios.post(url, data, { headers });

            // Log the message with all required fields
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
                messageId: response.data.messages[0].id
            });

            return response.data;
        } catch (error) {
            // Log failed message with all required fields
            await MessageLog.create({
                userId,
                recipient: to,
                messageType: 'template',
                content: {
                    templateName,
                    languageCode,
                    components
                },
                status: 'failed',
                error: error.message,
                messageId: (error.response && error.response.data && error.response.data.messages && error.response.data.messages[0] && error.response.data.messages[0].id) || Date.now().toString()
            });

            throw error;
        }
    }

    async getTemplates(userId) {
        try {
            const config = await this.getWhatsAppConfig(userId);
            if (!config) {
                throw new Error('WhatsApp configuration not found');
            }

            const url = `${this.baseUrl}/${config.whatsappBusinessAccountId}/message_templates`;
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

            const url = `${this.baseUrl}/${config.whatsappBusinessAccountId}/message_templates`;
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
}

module.exports = new WhatsAppService(); 