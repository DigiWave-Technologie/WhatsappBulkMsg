const axios = require('axios');
const config = require('../config/whatsapp');

class WhatsAppService {
    constructor() {
        this.baseUrl = config.apiUrl;
        this.apiKey = config.apiKey;
    }

    async sendMessage({ to, message, template, media, variables }) {
        try {
            const payload = {
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to,
                type: template ? 'template' : 'text'
            };

            if (template) {
                payload.template = {
                    name: template,
                    language: {
                        code: variables?.language || 'en'
                    },
                    components: variables?.components || []
                };
            } else {
                payload.text = {
                    body: message
                };
            }

            if (media && media.length > 0) {
                media.forEach(item => {
                    if (!payload[item.type]) {
                        payload[item.type] = {
                            link: item.url,
                            caption: item.caption
                        };
                    }
                });
            }

            const response = await axios.post(`${this.baseUrl}/messages`, payload, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            return {
                messageId: response.data.messages[0].id,
                status: 'sent'
            };
        } catch (error) {
            throw new Error('Failed to send WhatsApp message: ' + error.message);
        }
    }

    async sendTemplate({ to, template, language, components }) {
        try {
            const payload = {
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to,
                type: 'template',
                template: {
                    name: template,
                    language: {
                        code: language
                    },
                    components
                }
            };

            const response = await axios.post(`${this.baseUrl}/messages`, payload, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            return {
                messageId: response.data.messages[0].id,
                status: 'sent'
            };
        } catch (error) {
            throw new Error('Failed to send WhatsApp template: ' + error.message);
        }
    }

    async getMessageStatus(messageId) {
        try {
            const response = await axios.get(`${this.baseUrl}/messages/${messageId}`, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`
                }
            });

            return {
                status: response.data.status,
                timestamp: response.data.timestamp
            };
        } catch (error) {
            throw new Error('Failed to get message status: ' + error.message);
        }
    }

    async validateNumber(number) {
        try {
            const response = await axios.post(`${this.baseUrl}/contacts`, {
                blocking: 'wait',
                contacts: [number]
            }, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            return {
                valid: response.data.contacts[0].status === 'valid',
                status: response.data.contacts[0].status
            };
        } catch (error) {
            throw new Error('Failed to validate number: ' + error.message);
        }
    }

    async getBusinessProfile() {
        try {
            const response = await axios.get(`${this.baseUrl}/business/profile`, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`
                }
            });

            return response.data;
        } catch (error) {
            throw new Error('Failed to get business profile: ' + error.message);
        }
    }

    async updateBusinessProfile(data) {
        try {
            const response = await axios.patch(`${this.baseUrl}/business/profile`, data, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            return response.data;
        } catch (error) {
            throw new Error('Failed to update business profile: ' + error.message);
        }
    }
}

module.exports = new WhatsAppService(); 