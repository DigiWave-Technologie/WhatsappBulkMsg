const axios = require('axios');
const logger = require('../utils/logger');
const WhatsAppConfig = require('../models/WhatsAppConfig');
const WhatsAppOfficialTemplate = require('../models/WhatsAppOfficialTemplate');
const { ApiError } = require('../utils/ApiError');

class WhatsAppOfficialTemplateService {
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
        businessAccountId: config.whatsappBusinessAccountId,
        tokenEnd: config.accessToken.slice(-20)
      });

      const response = await axios.post(url, templateData, { headers });

      // Validate Meta API response
      if (!response.data || !response.data.id) {
        throw new ApiError(500, 'Invalid response from Meta API: Missing template ID');
      }

      logger.info('Template created successfully in Meta API:', {
        templateId: response.data.id,
        status: response.data.status,
        category: response.data.category
      });

      return response.data;
    } catch (error) {
      logger.error('Meta API template creation failed:', {
        error: error.response?.data || error.message,
        status: error.response?.status,
        templateName: templateData.name
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
        
        // Extract variables from header text
        const headerVariables = this.extractVariables(localTemplate.header.text);
        if (headerVariables.length > 0) {
          headerComponent.example = {
            header_text: headerVariables.map((_, index) => `Header Variable ${index + 1}`)
          };
        }
      } else if (localTemplate.header.type === 'media') {
        headerComponent.format = localTemplate.header.media.type.toUpperCase();
        if (localTemplate.header.media.type === 'image') {
          headerComponent.example = {
            header_handle: [localTemplate.header.media.url || 'https://example.com/image.jpg']
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
            // Add example for dynamic URLs
            if (button.url && button.url.includes('{{')) {
              metaButton.example = ['https://example.com/dynamic-url'];
            }
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

    // Get unique variable numbers and sort them
    const variableNumbers = [...new Set(matches.map(match => {
      const num = match.match(/\{\{(\d+)\}\}/)[1];
      return parseInt(num);
    }))].sort((a, b) => a - b);

    // Return array of variable placeholders
    return variableNumbers.map(num => `{{${num}}}`);
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


      // Validate required fields
      if (!template_name || !category || !language || !body) {
        throw new ApiError(400, 'Missing required fields: template_name, category, language, body');
      }

      // Validate template name format (Meta API requirements)
      if (!/^[a-z0-9_]+$/.test(template_name)) {
        throw new ApiError(400, 'Template name must contain only lowercase letters, numbers, and underscores');
      }

      if (template_name.length < 1 || template_name.length > 512) {
        throw new ApiError(400, 'Template name must be between 1 and 512 characters');
      }

      // Validate body text
      if (body.length > 1024) {
        throw new ApiError(400, 'Template body must be 1024 characters or less');
      }

      // Validate footer text if provided
      if (footer_text && footer_text.length > 60) {
        throw new ApiError(400, 'Footer text must be 60 characters or less');
      }

      // Get WhatsApp configuration
      const config = await this.getWhatsAppConfig(userId, whatsapp_business_account_id);

      // Check if template with same name already exists
      const existingTemplate = await WhatsAppOfficialTemplate.findOne({
        template_name,
        created_by: userId
      });

      if (existingTemplate) {
        throw new ApiError(400, 'Template with this name already exists');
      }

      // Create local template
      const localTemplate = await WhatsAppOfficialTemplate.create({
        template_name,
        category,
        language,
        template_type: template_type || 'basic',
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

          logger.info('Converting template to Meta format:', {
            localId: localTemplate._id,
            metaData: metaTemplateData
          });

          metaResponse = await this.createTemplateInMeta(metaTemplateData, config);

          // Update local template with Meta API response
          await WhatsAppOfficialTemplate.findByIdAndUpdate(localTemplate._id, {
            meta_template_id: metaResponse.id,
            meta_status: metaResponse.status,
            sync_status: 'synced',
            last_sync_at: new Date(),
            status: metaResponse.status.toLowerCase(),
            sync_attempts: 1,
            sync_error: null
          });

          syncResult = {
            success: true,
            metaResponse
          };

          logger.info('Template created and synced successfully:', {
            localTemplateId: localTemplate._id,
            metaTemplateId: metaResponse.id,
            status: metaResponse.status
          });

        } catch (syncError) {
          // Update local template with sync error
          await WhatsAppOfficialTemplate.findByIdAndUpdate(localTemplate._id, {
            sync_status: 'sync_failed',
            sync_error: syncError.message,
            sync_attempts: 1,
            last_sync_at: new Date(),
            status: 'draft' // Keep as draft if sync fails
          });

          syncResult = {
            success: false,
            error: syncError.message,
            errorCode: syncError.statusCode || 500
          };

          logger.error('Template created locally but Meta sync failed:', {
            templateId: localTemplate._id,
            templateName: localTemplate.template_name,
            error: syncError.message,
            statusCode: syncError.statusCode
          });
        }
      }

      // Fetch updated template
      const updatedTemplate = await WhatsAppOfficialTemplate.findById(localTemplate._id);

      return {
        localTemplate: updatedTemplate,
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
}

module.exports = new WhatsAppOfficialTemplateService();
