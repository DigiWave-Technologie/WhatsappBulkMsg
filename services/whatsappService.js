const axios = require('axios');
const { ApiError } = require('../utils/ApiError');
const config = require('../config/config');
const WhatsAppConfig = require('../models/WhatsAppConfig');
const MessageLog = require('../models/MessageLog');
const logger = require('../utils/logger');

class WhatsAppService {
    constructor() {
        this.metaApiUrl = 'https://graph.facebook.com/v22.0';
        this.metaPhoneNumberId = '441959912339170';
        this.metaAccessToken = 'EAAaWMPrfZA38BO09zy1ZB6BKsZAxV3BgvXnWkpOSMXuag99gFoWAqZAIesehyC2ypkNhnV2M01MI5MJKxt6FSXZBq8aGwBIS3l82ajosUx8YT260AYC0gKZA4DTe1Mc8yZBaHAUzVOjtZB7HCYP92B8TnnqpJVjkiAiJZA2AP6quD2tQmoK5gOjVVZASwR6JhtYOaclbEZAJ9qOOQiZCa3T2fihHew3pXqIUOh32Lw2SdJfsUE8ZD';
        this.dummyMode = false;
    }

    // Initialize Meta Cloud API client
    async initMetaClient(phoneNumberId, accessToken) {
        this.metaPhoneNumberId = phoneNumberId || this.metaPhoneNumberId;
        this.metaAccessToken = accessToken || this.metaAccessToken;
    }

    // Initialize WAAPI client
    async initWaapiClient(apiKey) {
        this.waapiKey = apiKey || 'dummy_api_key';
    }

    // Send message using Meta Cloud API
    async sendMetaMessage(to, message) {
        try {
            const response = await axios.post(
                `${this.metaApiUrl}/${this.metaPhoneNumberId}/messages`,
                {
                    messaging_product: 'whatsapp',
                    to,
                    ...message
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.metaAccessToken}`,
                        'Content-Type': 'application/json'
                    }
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
    async sendQuickMessage(to, text, media = null) {
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

        return this.sendMetaMessage(to, message);
    }

    // Send Button Campaign Message
    async sendButtonMessage(to, text, buttons) {
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

        return this.sendMetaMessage(to, message);
    }

    // Send DP (Display Picture) Campaign Message
    async sendDPMessage(to, imageUrl, caption = '') {
        const message = {
            type: 'image',
            image: {
                link: imageUrl,
                caption
            }
        };

        return this.sendMetaMessage(to, message);
    }

    // Send Poll Campaign Message
    async sendPollMessage(to, question, options) {
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

        return this.sendMetaMessage(to, message);
    }

    // Send Group Campaign Message
    async sendGroupMessage(groupId, message) {
        // Note: This requires special permissions and approval from WhatsApp
        const response = await axios.post(
            `${this.metaApiUrl}/${this.metaPhoneNumberId}/messages`,
            {
                messaging_product: 'whatsapp',
                recipient_type: 'group',
                to: groupId,
                ...message
            },
            {
                headers: {
                    'Authorization': `Bearer ${this.metaAccessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        return response.data;
    }

    // Send Template Message
    async sendTemplateMessage(to, templateName, languageCode, components = []) {
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

        return this.sendMetaMessage(to, message);
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

            const url = `${this.metaApiUrl}/${config.phoneNumberId}/messages`;
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

            // Log the message
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
            // Log failed message
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
                messageId: (error.response?.data?.messages?.[0]?.id) || `dummy_failed_${Date.now()}`
            });

            if (this.dummyMode) {
                return {
                    messaging_product: 'whatsapp',
                    contacts: [{ input: to, wa_id: 'dummy_wa_id' }],
                    messages: [{ id: `dummy_msg_${Date.now()}` }]
                };
            }

            throw error;
        }
    }

    async getTemplates(userId) {
        try {
            const config = await this.getWhatsAppConfig(userId);
            if (!config) {
                throw new Error('WhatsApp configuration not found');
            }

            const url = `${this.metaApiUrl}/${config.whatsappBusinessAccountId}/message_templates`;
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

            const url = `${this.metaApiUrl}/${config.whatsappBusinessAccountId}/message_templates`;
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
    async sendListMessage(to, text, buttonText, sections) {
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

        return this.sendMetaMessage(to, message);
    }

    // Send Location Campaign Message
    async sendLocationMessage(to, latitude, longitude, name, address) {
        const message = {
            type: 'location',
            location: {
                latitude,
                longitude,
                name,
                address
            }
        };

        return this.sendMetaMessage(to, message);
    }

    // Send Contact Campaign Message
    async sendContactMessage(to, contacts) {
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

        return this.sendMetaMessage(to, message);
    }

    // Send Reaction Campaign Message
    async sendReactionMessage(to, messageId, emoji) {
        const message = {
            type: 'reaction',
            reaction: {
                message_id: messageId,
                emoji
            }
        };

        return this.sendMetaMessage(to, message);
    }

    // Send Order Campaign Message
    async sendOrderMessage(to, orderId, orderItems, orderTotal) {
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

        return this.sendMetaMessage(to, message);
    }

    // Send Interactive Campaign Message (Combined)
    async sendInteractiveMessage(to, type, data) {
        const message = {
            type: 'interactive',
            interactive: {
                type,
                ...data
            }
        };

        return this.sendMetaMessage(to, message);
    }

    // Send Media Campaign Message with Progress
    async sendMediaMessageWithProgress(to, mediaType, mediaUrl, caption, onProgress) {
        const message = {
            type: mediaType,
            [mediaType]: {
                link: mediaUrl,
                caption
            }
        };

        try {
            const response = await axios.post(
                `${this.metaApiUrl}/${this.metaPhoneNumberId}/messages`,
                {
                    messaging_product: 'whatsapp',
                    recipient_type: 'individual',
                    to,
                    ...message
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.metaAccessToken}`,
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
    async sendBulkMessages(recipients, message, options = {}) {
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
                        const result = await this.sendMetaMessage(recipient, message);
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
}

module.exports = new WhatsAppService(); 