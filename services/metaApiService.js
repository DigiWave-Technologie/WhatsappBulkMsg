const axios = require('axios');
const config = require('../config');
const { ApiError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const META_API_VERSION = 'v17.0';
const BASE_URL = `https://graph.facebook.com/${META_API_VERSION}`;

/**
 * Meta Graph API Service for WhatsApp Business API
 */
class MetaApiService {
  constructor() {
    // For test purposes, use mock responses if environment is not production
    this.useMockResponses = process.env.NODE_ENV !== 'production';
  }

  /**
   * Set API credentials for requests
   * @param {string} phoneNumberId - The WhatsApp phone number ID
   * @param {string} accessToken - The access token
   */
  setCredentials(phoneNumberId, accessToken) {
    this.phoneNumberId = phoneNumberId;
    this.accessToken = accessToken;
  }

  /**
   * Get the axios instance with proper configuration
   * @returns {axios.AxiosInstance}
   */
  getAxiosInstance() {
    return axios.create({
      baseURL: BASE_URL,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.accessToken}`
      }
    });
  }

  /**
   * Send a WhatsApp template message
   * @param {string} to - Recipient phone number
   * @param {string} templateName - The template name
   * @param {string} languageCode - The language code
   * @param {Array} components - Template components with parameters
   * @returns {Promise<Object>} - Response data
   */
  async sendTemplateMessage(to, templateName, languageCode = 'en_US', components = []) {
    try {
      if (this.useMockResponses) {
        return this._mockSendTemplateMessage(to, templateName);
      }

      const instance = this.getAxiosInstance();
      const response = await instance.post(`/${this.phoneNumberId}/messages`, {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'template',
        template: {
          name: templateName,
          language: {
            code: languageCode
          },
          components
        }
      });

      return response.data;
    } catch (error) {
      logger.error(`Error sending template message: ${error.message}`, {
        to,
        templateName,
        error: error.response?.data || error.message
      });

      throw new ApiError(
        error.response?.status || 500,
        error.response?.data?.error?.message || 'Failed to send template message'
      );
    }
  }

  /**
   * Send a WhatsApp text message
   * @param {string} to - Recipient phone number
   * @param {string} text - Message text
   * @returns {Promise<Object>} - Response data
   */
  async sendTextMessage(to, text) {
    try {
      if (this.useMockResponses) {
        return this._mockSendTextMessage(to, text);
      }

      const instance = this.getAxiosInstance();
      const response = await instance.post(`/${this.phoneNumberId}/messages`, {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'text',
        text: {
          preview_url: false,
          body: text
        }
      });

      return response.data;
    } catch (error) {
      logger.error(`Error sending text message: ${error.message}`, {
        to,
        error: error.response?.data || error.message
      });

      throw new ApiError(
        error.response?.status || 500,
        error.response?.data?.error?.message || 'Failed to send text message'
      );
    }
  }

  /**
   * Send a WhatsApp media message
   * @param {string} to - Recipient phone number
   * @param {string} mediaType - The media type (image, video, document, audio)
   * @param {string} mediaUrl - URL for the media
   * @param {string} caption - Optional caption
   * @returns {Promise<Object>} - Response data
   */
  async sendMediaMessage(to, mediaType, mediaUrl, caption = '') {
    try {
      if (this.useMockResponses) {
        return this._mockSendMediaMessage(to, mediaType, mediaUrl);
      }

      const instance = this.getAxiosInstance();
      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: mediaType,
        [mediaType]: {
          link: mediaUrl
        }
      };

      // Add caption if provided (for image, video, document)
      if (caption && ['image', 'video', 'document'].includes(mediaType)) {
        payload[mediaType].caption = caption;
      }

      // Add filename for documents
      if (mediaType === 'document') {
        payload.document.filename = caption || 'document';
      }

      const response = await instance.post(`/${this.phoneNumberId}/messages`, payload);
      return response.data;
    } catch (error) {
      logger.error(`Error sending media message: ${error.message}`, {
        to,
        mediaType,
        error: error.response?.data || error.message
      });

      throw new ApiError(
        error.response?.status || 500,
        error.response?.data?.error?.message || 'Failed to send media message'
      );
    }
  }

  /**
   * Send interactive message (buttons, list, etc.)
   * @param {string} to - Recipient phone number
   * @param {Object} interactive - Interactive message object
   * @returns {Promise<Object>} - Response data
   */
  async sendInteractiveMessage(to, interactive) {
    try {
      if (this.useMockResponses) {
        return this._mockSendInteractiveMessage(to, interactive);
      }

      const instance = this.getAxiosInstance();
      const response = await instance.post(`/${this.phoneNumberId}/messages`, {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'interactive',
        interactive
      });

      return response.data;
    } catch (error) {
      logger.error(`Error sending interactive message: ${error.message}`, {
        to,
        error: error.response?.data || error.message
      });

      throw new ApiError(
        error.response?.status || 500,
        error.response?.data?.error?.message || 'Failed to send interactive message'
      );
    }
  }

  /**
   * Send a poll message
   * @param {string} to - Recipient phone number
   * @param {string} question - Poll question
   * @param {Array<string>} options - Poll options
   * @returns {Promise<Object>} - Response data
   */
  async sendPollMessage(to, question, options) {
    try {
      if (this.useMockResponses) {
        return this._mockSendPollMessage(to, question, options);
      }

      // Create the poll structure
      const poll = {
        type: 'poll',
        poll: {
          title: question,
          options: options.map(option => ({ title: option })),
          selectableCount: 1 // Default to single selection
        }
      };

      const instance = this.getAxiosInstance();
      const response = await instance.post(`/${this.phoneNumberId}/messages`, {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'interactive',
        interactive: poll
      });

      return response.data;
    } catch (error) {
      logger.error(`Error sending poll message: ${error.message}`, {
        to,
        question,
        error: error.response?.data || error.message
      });

      throw new ApiError(
        error.response?.status || 500,
        error.response?.data?.error?.message || 'Failed to send poll message'
      );
    }
  }

  /**
   * Get templates for the business account
   * @returns {Promise<Array>} - Template list
   */
  async getTemplates() {
    try {
      if (this.useMockResponses) {
        return this._mockGetTemplates();
      }

      const instance = this.getAxiosInstance();
      const response = await instance.get(`/${this.phoneNumberId}/message_templates`);
      return response.data.data;
    } catch (error) {
      logger.error(`Error getting templates: ${error.message}`, {
        error: error.response?.data || error.message
      });

      throw new ApiError(
        error.response?.status || 500,
        error.response?.data?.error?.message || 'Failed to get templates'
      );
    }
  }

  /**
   * Create a new template
   * @param {Object} templateData - Template data in Meta API format
   * @returns {Promise<Object>} - Response data
   */
  async createTemplate(templateData) {
    try {
      if (this.useMockResponses) {
        return this._mockCreateTemplate(templateData);
      }

      const instance = this.getAxiosInstance();
      const response = await instance.post(`/${this.phoneNumberId}/message_templates`, templateData);
      return response.data;
    } catch (error) {
      logger.error(`Error creating template: ${error.message}`, {
        templateName: templateData.name,
        error: error.response?.data || error.message
      });

      throw new ApiError(
        error.response?.status || 500,
        error.response?.data?.error?.message || 'Failed to create template'
      );
    }
  }

  /**
   * Upload media to Meta servers
   * @param {string} mediaType - The media type
   * @param {string} mediaUrl - URL to the media file
   * @returns {Promise<Object>} - Response with media ID
   */
  async uploadMedia(mediaType, mediaUrl) {
    try {
      if (this.useMockResponses) {
        return this._mockUploadMedia(mediaType, mediaUrl);
      }

      // First, get the media file
      const mediaResponse = await axios.get(mediaUrl, { responseType: 'arraybuffer' });
      const buffer = Buffer.from(mediaResponse.data, 'binary');

      // Then upload to WhatsApp servers
      const formData = new FormData();
      formData.append('file', new Blob([buffer]), 'media');
      formData.append('type', mediaType);
      formData.append('messaging_product', 'whatsapp');

      const instance = this.getAxiosInstance();
      const response = await instance.post(`/${this.phoneNumberId}/media`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      return response.data;
    } catch (error) {
      logger.error(`Error uploading media: ${error.message}`, {
        mediaType,
        error: error.response?.data || error.message
      });

      throw new ApiError(
        error.response?.status || 500,
        error.response?.data?.error?.message || 'Failed to upload media'
      );
    }
  }

  // Mock response methods for testing
  _mockSendTemplateMessage(to, templateName) {
    const messageId = `mock_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    return {
      messaging_product: 'whatsapp',
      contacts: [{
        input: to,
        wa_id: to
      }],
      messages: [{
        id: messageId,
        message_status: 'accepted'
      }]
    };
  }

  _mockSendTextMessage(to, text) {
    const messageId = `mock_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    return {
      messaging_product: 'whatsapp',
      contacts: [{
        input: to,
        wa_id: to
      }],
      messages: [{
        id: messageId,
        message_status: 'accepted'
      }]
    };
  }

  _mockSendMediaMessage(to, mediaType) {
    const messageId = `mock_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    return {
      messaging_product: 'whatsapp',
      contacts: [{
        input: to,
        wa_id: to
      }],
      messages: [{
        id: messageId,
        message_status: 'accepted'
      }]
    };
  }

  _mockSendInteractiveMessage(to) {
    const messageId = `mock_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    return {
      messaging_product: 'whatsapp',
      contacts: [{
        input: to,
        wa_id: to
      }],
      messages: [{
        id: messageId,
        message_status: 'accepted'
      }]
    };
  }

  _mockSendPollMessage(to) {
    const messageId = `mock_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    return {
      messaging_product: 'whatsapp',
      contacts: [{
        input: to,
        wa_id: to
      }],
      messages: [{
        id: messageId,
        message_status: 'accepted'
      }]
    };
  }

  _mockGetTemplates() {
    return [
      {
        name: 'welcome_template',
        category: 'MARKETING',
        language: {
          code: 'en_US'
        },
        status: 'APPROVED',
        components: [
          {
            type: 'HEADER',
            format: 'TEXT',
            text: 'Welcome to our service!'
          },
          {
            type: 'BODY',
            text: 'Hello {{1}}, thank you for joining us. We're excited to have you on board!'
          },
          {
            type: 'BUTTONS',
            buttons: [
              {
                type: 'QUICK_REPLY',
                text: 'Get Started'
              }
            ]
          }
        ]
      },
      {
        name: 'order_confirmation',
        category: 'UTILITY',
        language: {
          code: 'en_US'
        },
        status: 'APPROVED',
        components: [
          {
            type: 'HEADER',
            format: 'IMAGE'
          },
          {
            type: 'BODY',
            text: 'Hello {{1}}, your order #{{2}} has been confirmed and will be shipped soon.'
          }
        ]
      }
    ];
  }

  _mockCreateTemplate(templateData) {
    return {
      id: `${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      status: 'PENDING',
      ...templateData
    };
  }

  _mockUploadMedia(mediaType) {
    return {
      id: `${mediaType}_${Date.now()}_${Math.floor(Math.random() * 1000)}`
    };
  }
}

module.exports = new MetaApiService(); 