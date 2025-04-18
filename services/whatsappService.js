const config = require('../config');

class WhatsAppService {
    constructor() {
        // Mock configuration - no actual API credentials needed
        this.baseUrl = 'https://mock-whatsapp-api.example.com';
        this.apiKey = 'mock-api-key';
        this.phoneNumberId = 'mock-phone-number-id';
        this.businessAccountId = 'mock-business-account-id';
    }

    async sendMessage(to, message, media = null) {
        try {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Mock successful response
            return {
                messaging_product: 'whatsapp',
                contacts: [{ input: to, wa_id: `mock-${to}` }],
                messages: [{ id: `mock-${Date.now()}` }]
            };
        } catch (error) {
            console.error('Mock WhatsApp sendMessage error:', error);
            throw new Error(`Failed to send WhatsApp message: ${error.message}`);
        }
    }

    async sendTemplate(to, templateName, languageCode, components = []) {
        try {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Mock successful response
            return {
                messaging_product: 'whatsapp',
                contacts: [{ input: to, wa_id: `mock-${to}` }],
                messages: [{ id: `mock-template-${Date.now()}` }]
            };
        } catch (error) {
            console.error('Mock WhatsApp sendTemplate error:', error);
            throw new Error(`Failed to send template message: ${error.message}`);
        }
    }

    async getMessageStatus(messageId) {
        try {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Mock successful response with random status
            const statuses = ['sent', 'delivered', 'read'];
            const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
            
            return {
                messaging_product: 'whatsapp',
                status: randomStatus,
                message_id: messageId
            };
        } catch (error) {
            console.error('Mock WhatsApp getMessageStatus error:', error);
            throw new Error(`Failed to get message status: ${error.message}`);
        }
    }

    async validateNumber(phoneNumber) {
        try {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Mock successful response - always return valid
            return {
                valid: true,
                normalized_number: phoneNumber
            };
        } catch (error) {
            console.error('Mock WhatsApp validateNumber error:', error);
            throw new Error(`Failed to validate phone number: ${error.message}`);
        }
    }

    async getBusinessProfile() {
        try {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Mock successful response
            return {
                messaging_product: 'whatsapp',
                profile: {
                    name: 'Mock Business',
                    about: 'This is a mock business profile',
                    messaging_product: 'whatsapp',
                    category: 'BUSINESS',
                    address: '123 Mock Street, Mock City',
                    email: 'mock@example.com',
                    websites: ['https://example.com'],
                    profile_picture_url: 'https://example.com/mock-profile.jpg'
                }
            };
        } catch (error) {
            console.error('Mock WhatsApp getBusinessProfile error:', error);
            throw new Error(`Failed to get business profile: ${error.message}`);
        }
    }

    async updateBusinessProfile(profileData) {
        try {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Mock successful response
            return {
                success: true,
                profile: {
                    ...profileData,
                    messaging_product: 'whatsapp'
                }
            };
        } catch (error) {
            console.error('Mock WhatsApp updateBusinessProfile error:', error);
            throw new Error(`Failed to update business profile: ${error.message}`);
        }
    }
}

module.exports = new WhatsAppService(); 