const axios = require('axios');
const logger = require('../utils/logger');
const WhatsAppConfig = require('../models/WhatsAppConfig');
const WhatsAppOfficialTemplate = require('../models/WhatsAppOfficialTemplate');
const { ApiError } = require('../utils/ApiError');

class WhatsAppTemplateService {
  constructor() {
    this.baseUrl = 'https://graph.facebook.com/v22.0';
  }

  /**
   * Get WhatsApp configuration for user
   */
  async getWhatsAppConfig(userId, businessAccountId = null) {
    try {
      const query = { userId, is_active: true };
      
      if (businessAccountId) {
        query.whatsappBusinessAccountId = businessAccountId;
      }

      // Try to find specific config or default config
      let config = await WhatsAppConfig.findOne(query);
      if (!config && !businessAccountId) {
        // Fallback to any active config
        config = await WhatsAppConfig.findOne({ userId, is_active: true });
      }

      if (!config) {
        throw new ApiError(404, 'WhatsApp configuration not found. Please configure WhatsApp first.');
      }

      return config;
    } catch (error) {
      logger.error('Error getting WhatsApp config:', error);
      throw error;
    }
  }

  /**
   * Create template in Meta API
   */
  async createTemplateInMeta(templateData, config) {
    try {
      const url = `${this.baseUrl}/${config.whatsappBusinessAccountId}/message_templates`;
      
      const headers = {
        'Authorization': `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json'
      };

      logger.info('Creating template in Meta API:', {
        templateName: templateData.name,
        businessAccountId: config.whatsappBusinessAccountId
      });

      const response = await axios.post(url, templateData, { headers });
      
      logger.info('Template created successfully in Meta API:', {
        templateId: response.data.id,
        status: response.data.status
      });

      return response.data;
    } catch (error) {
      logger.error('Meta API template creation failed:', {
        error: error.response?.data || error.message,
        status: error.response?.status
      });
      
      const errorMessage = error.response?.data?.error?.message || error.message;
      throw new ApiError(400, `Meta API Error: ${errorMessage}`);
    }
  }

  /**
   * Convert local template to Meta API format
   */
  convertToMetaFormat(localTemplate) {
    const metaTemplate = {
      name: localTemplate.template_name,
      language: localTemplate.language,
      category: localTemplate.meta_category || 'MARKETING',
      components: []
    };

    // Add header component
    if (localTemplate.header && localTemplate.header.type !== 'none') {
      const headerComponent = {
        type: 'HEADER'
      };

      if (localTemplate.header.type === 'text') {
        headerComponent.format = 'TEXT';
        headerComponent.text = localTemplate.header.text;
      } else if (localTemplate.header.type === 'media') {
        headerComponent.format = localTemplate.header.media.type.toUpperCase();
        if (localTemplate.header.media.type === 'image') {
          headerComponent.example = {
            header_handle: [localTemplate.header.media.url]
          };
        }
      }

      metaTemplate.components.push(headerComponent);
    }

    // Add body component
    if (localTemplate.body) {
      const bodyComponent = {
        type: 'BODY',
        text: localTemplate.body
      };

      // Extract variables from body text
      const variables = this.extractVariables(localTemplate.body);
      if (variables.length > 0) {
        bodyComponent.example = {
          body_text: [variables.map((_, index) => `Variable ${index + 1}`)]
        };
      }

      metaTemplate.components.push(bodyComponent);
    }

    // Add footer component
    if (localTemplate.footer_text) {
      metaTemplate.components.push({
        type: 'FOOTER',
        text: localTemplate.footer_text
      });
    }

    // Add buttons component
    if (localTemplate.action_buttons && localTemplate.action_buttons.length > 0) {
      const buttonsComponent = {
        type: 'BUTTONS',
        buttons: localTemplate.action_buttons.map(button => {
          const metaButton = {
            type: button.type.toUpperCase(),
            text: button.text
          };

          if (button.type === 'url') {
            metaButton.url = button.url;
          } else if (button.type === 'phone_number') {
            metaButton.phone_number = button.phone_number;
          }

          return metaButton;
        })
      };

      metaTemplate.components.push(buttonsComponent);
    }

    return metaTemplate;
  }

  /**
   * Extract variables from text ({{1}}, {{2}}, etc.)
   */
  extractVariables(text) {
    if (!text) return [];
    const matches = text.match(/\{\{\d+\}\}/g) || [];
    return matches.map(match => match.replace(/[{}]/g, ''));
  }

  /**
   * Create template with Meta API sync
   */
  async createTemplate(userId, templateData) {
    try {
      const {
        template_name,
        category,
        language,
        template_type,
        header,
        body,
        footer_text,
        action_buttons,
        whatsapp_business_account_id,
        auto_sync_to_meta = true,
        meta_category = 'MARKETING'
      } = templateData;

      // Get WhatsApp configuration
      const config = await this.getWhatsAppConfig(userId, whatsapp_business_account_id);

      // Create local template
      const localTemplate = await WhatsAppOfficialTemplate.create({
        template_name,
        category,
        language,
        template_type,
        header: header || { type: 'none' },
        body,
        footer_text,
        action_buttons: action_buttons || [],
        whatsapp_business_account_id: config.whatsappBusinessAccountId,
        meta_category,
        created_by: userId,
        status: auto_sync_to_meta ? 'pending' : 'draft',
        sync_status: auto_sync_to_meta ? 'syncing' : 'not_synced'
      });

      let metaResponse = null;
      let syncResult = { success: false };

      // Sync to Meta API if requested
      if (auto_sync_to_meta) {
        try {
          const metaTemplateData = this.convertToMetaFormat(localTemplate);
          metaResponse = await this.createTemplateInMeta(metaTemplateData, config);

          // Update local template with Meta API response
          await WhatsAppOfficialTemplate.findByIdAndUpdate(localTemplate._id, {
            meta_template_id: metaResponse.id,
            meta_status: metaResponse.status,
            sync_status: 'synced',
            last_sync_at: new Date(),
            status: metaResponse.status.toLowerCase()
          });

          syncResult = {
            success: true,
            metaResponse
          };

          logger.info('Template created and synced successfully:', {
            localTemplateId: localTemplate._id,
            metaTemplateId: metaResponse.id
          });

        } catch (syncError) {
          // Update local template with sync error
          await WhatsAppOfficialTemplate.findByIdAndUpdate(localTemplate._id, {
            sync_status: 'sync_failed',
            sync_error: syncError.message,
            sync_attempts: 1
          });

          syncResult = {
            success: false,
            error: syncError.message
          };

          logger.error('Template created locally but Meta sync failed:', syncError);
        }
      }

      return {
        localTemplate,
        syncResult,
        metaSync: auto_sync_to_meta
      };

    } catch (error) {
      logger.error('Template creation failed:', error);
      throw error;
    }
  }

  /**
   * Get template status from Meta API
   */
  async getTemplateStatus(templateId, config) {
    try {
      const url = `${this.baseUrl}/${templateId}`;
      
      const headers = {
        'Authorization': `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json'
      };

      const response = await axios.get(url, { headers });
      return response.data;
    } catch (error) {
      logger.error('Failed to get template status from Meta API:', error);
      throw new ApiError(400, `Meta API Error: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * List templates from Meta API
   */
  async listTemplatesFromMeta(config, limit = 100) {
    try {
      const url = `${this.baseUrl}/${config.whatsappBusinessAccountId}/message_templates`;
      
      const headers = {
        'Authorization': `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json'
      };

      const params = { limit };
      const response = await axios.get(url, { headers, params });
      
      return response.data.data || [];
    } catch (error) {
      logger.error('Failed to list templates from Meta API:', error);
      throw new ApiError(400, `Meta API Error: ${error.response?.data?.error?.message || error.message}`);
    }
  }
}

module.exports = new WhatsAppTemplateService();
