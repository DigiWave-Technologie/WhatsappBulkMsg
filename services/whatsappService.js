const axios = require('axios');
const whatsappConfig = require('../config/whatsapp');

class WhatsAppService {
    constructor() {
        this.token = 'EAAaWMPrfZA38BO8hGZAW5WNbnhNmiEDE5ePZAmpBYIyDziZCkcmZA2Uz1xcNrwumerG5p6f4Y8wWCUnJgtUAGOZCfhZCrOCWNqF3TEjZB15ZAjdTsZA8njj8yxOR0XZAuVkmaslW3ZCUgZBKZBNBhJYep7oCX8CKDgE9peRXJch7gZB2LgrrnwQgC7RLy8aRwIRNayYKOvm0MmS5KXx5ZAZBdx7LRv1zJlqrIhZCihCMqNTKy0Giv1BpwYJvEIOZC8ZD';
        this.phoneNumberId = '441959912339170';  // Your phone number ID from the curl command
        this.apiUrl = 'https://graph.facebook.com/v22.0';
    }

    async sendTextMessage(to, message) {
        try {
            const response = await axios({
                method: 'POST',
                url: `${this.apiUrl}/${this.phoneNumberId}/messages`,
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json',
                },
                data: {
                    messaging_product: 'whatsapp',
                    to: to,
                    type: 'text',
                    text: { body: message }
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error sending WhatsApp message:', error.response?.data || error.message);
            throw error;
        }
    }

    async sendTemplateMessage(to, templateName, languageCode) {
        try {
            const response = await axios({
                method: 'POST',
                url: `${this.apiUrl}/${this.phoneNumberId}/messages`,
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json',
                },
                data: {
                    messaging_product: 'whatsapp',
                    to: to,
                    type: 'template',
                    template: {
                        name: templateName,
                        language: {
                            code: languageCode
                        }
                    }
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error sending WhatsApp template message:', error.response?.data || error.message);
            throw error;
        }
    }

    async sendMediaMessage(to, mediaType, mediaUrl, caption = '') {
        try {
            const response = await axios({
                method: 'POST',
                url: `${this.apiUrl}/${this.phoneNumberId}/messages`,
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json',
                },
                data: {
                    messaging_product: 'whatsapp',
                    to: to,
                    type: mediaType,
                    [mediaType]: {
                        link: mediaUrl,
                        caption: caption
                    }
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error sending WhatsApp media message:', error.response?.data || error.message);
            throw error;
        }
    }

    async getMessageStatus(messageId) {
        try {
            const response = await axios({
                method: 'GET',
                url: `${this.apiUrl}/${messageId}`,
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error getting message status:', error.response?.data || error.message);
            throw error;
        }
    }

    async validateNumber(number) {
        try {
            const response = await axios.post(`${this.apiUrl}/contacts`, {
                blocking: 'wait',
                contacts: [number]
            }, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
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
            const response = await axios.get(`${this.apiUrl}/business/profile`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            return response.data;
        } catch (error) {
            throw new Error('Failed to get business profile: ' + error.message);
        }
    }

    async updateBusinessProfile(data) {
        try {
            const response = await axios.patch(`${this.apiUrl}/business/profile`, data, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
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