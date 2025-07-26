const axios = require('axios');
const logger = require('../utils/logger');
const WhatsAppConfig = require('../models/WhatsAppConfig');
const WhatsAppOfficialCategory = require('../models/WhatsAppOfficialCategory');
const Category = require('../models/Category');
const User = require('../models/User');
const MetaTemplate = require('../models/MetaTemplate');
const { Credit, CreditTransaction } = require('../models/Credit');
const { ApiError } = require('../utils/ApiError');
const { checkPermission } = require('../utils/permissions');

class MetaTemplateService {
  constructor() {
    this.baseUrl = 'https://graph.facebook.com/v18.0';
  }

  /**
   * Check user permissions for WhatsApp Official template management
   */
  async checkTemplatePermissions(userId, action = 'canManageWhatsAppOfficialTemplates') {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    // Super admin has all permissions
    if (user.role === 'super_admin') {
      return user;
    }

    // Check UI-based permissions for WhatsApp Official templates
    const hasPermission = user.rolePermissions && user.rolePermissions[action];
    if (!hasPermission) {
      throw new ApiError(403, `Insufficient permissions for WhatsApp Official templates. Required: ${action}`);
    }

    return user;
  }

  /**
   * Get WhatsApp configuration for user
   */
  async getWhatsAppConfig(userId, whatsappBusinessAccountId = null) {
    let query = { userId, is_active: true };
    
    if (whatsappBusinessAccountId) {
      query.whatsappBusinessAccountId = whatsappBusinessAccountId;
    } else {
      query.is_default = true;
    }

    const config = await WhatsAppConfig.findOne(query);
    if (!config) {
      throw new ApiError(404, 'WhatsApp configuration not found. Please configure WhatsApp API first.');
    }

    if (!config.accessToken || !config.whatsappBusinessAccountId) {
      throw new ApiError(400, 'WhatsApp configuration is incomplete. Missing access token or business account ID.');
    }

    return config;
  }

  /**
   * Process template data for Meta API with full support for all template types
   */
  async processTemplateData(templateData, userId) {
    const {
      template_name,
      language = 'en_US',
      category = 'MARKETING',
      components = [],
      // Legacy support
      body,
      footer_text,
      header,
      action_buttons,
      whatsapp_business_account_id,
      whatsapp_official_category_id,
      campaign_category_id
    } = templateData;

    // Validate required fields
    if (!template_name || !language) {
      throw new ApiError(400, 'Missing required fields: template_name, language');
    }

    // Check if we have either components (new format) or body (legacy format)
    if (!components || components.length === 0) {
      if (!body) {
        throw new ApiError(400, 'Missing required fields: either components array or body text is required');
      }
    }

    // Validate template name format (Meta API requirements)
    if (!/^[a-z0-9_]+$/.test(template_name)) {
      throw new ApiError(400, 'Template name must contain only lowercase letters, numbers, and underscores');
    }

    if (template_name.length < 1 || template_name.length > 512) {
      throw new ApiError(400, 'Template name must be between 1 and 512 characters');
    }

    // Validate WhatsApp Official Category if provided
    let whatsappCategory = null;
    if (whatsapp_official_category_id) {
      whatsappCategory = await WhatsAppOfficialCategory.findById(whatsapp_official_category_id);
      if (!whatsappCategory) {
        throw new ApiError(404, 'WhatsApp Official Category not found');
      }
    }

    // Validate Campaign Category for credit deduction
    let campaignCategory = null;
    let creditCost = 1; // Default credit cost
    if (campaign_category_id) {
      campaignCategory = await Category.findById(campaign_category_id);
      if (!campaignCategory) {
        throw new ApiError(404, 'Campaign Category not found');
      }
      creditCost = campaignCategory.creditCost || 1;
    }

    // Check credits before creating template
    if (campaignCategory) {
      await this.checkTemplateCredits(userId, campaign_category_id, creditCost);
    }

    // Build Meta API template structure
    const metaTemplate = {
      name: template_name,
      language: language,
      category: category.toUpperCase(),
      components: []
    };

    let variableCount = 0;

    // Process components (new format) or legacy format
    if (components && components.length > 0) {
      // New comprehensive format
      metaTemplate.components = await this.processComponents(components);
      variableCount = this.countVariablesInComponents(components);
    } else {
      // Legacy format support
      metaTemplate.components = await this.buildLegacyComponents({
        body,
        footer_text,
        header,
        action_buttons
      });
      variableCount = this.extractVariables(body || '').length;
    }

    return {
      metaTemplate,
      whatsappCategory,
      campaignCategory,
      creditCost,
      variableCount,
      whatsapp_official_category_id,
      campaign_category_id
    };
  }

  /**
   * Process components for comprehensive template support
   */
  async processComponents(components) {
    const processedComponents = [];

    for (const component of components) {
      const processedComponent = { type: component.type.toUpperCase() };

      switch (component.type.toUpperCase()) {
        case 'HEADER':
          await this.processHeaderComponent(processedComponent, component);
          break;
        case 'BODY':
          this.processBodyComponent(processedComponent, component);
          break;
        case 'FOOTER':
          this.processFooterComponent(processedComponent, component);
          break;
        case 'BUTTONS':
          this.processButtonsComponent(processedComponent, component);
          break;
        default:
          throw new ApiError(400, `Unsupported component type: ${component.type}`);
      }

      processedComponents.push(processedComponent);
    }

    return processedComponents;
  }

  /**
   * Process header component with media support
   */
  async processHeaderComponent(processedComponent, component) {
    const { format, text, media, location, example } = component;

    if (!format) {
      throw new ApiError(400, 'Header component must have a format');
    }

    processedComponent.format = format.toUpperCase();

    switch (format.toUpperCase()) {
      case 'TEXT':
        if (!text) {
          throw new ApiError(400, 'Text header must have text content');
        }
        if (text.length > 60) {
          throw new ApiError(400, 'Header text must be 60 characters or less');
        }
        processedComponent.text = text;

        // Add example for variables - Meta API expects array format
        const variables = this.extractVariables(text);
        if (variables.length > 0) {
          processedComponent.example = {
            header_text: variables.map((_, index) => `Header Variable ${index + 1}`)
          };
        }
        break;

      case 'IMAGE':
      case 'VIDEO':
      case 'DOCUMENT':
        // For media headers in API v22, handle direct example format
        if (example) {
          // Use the provided example directly (exact API v22 format)
          // Support both header_handle and header_url formats
          processedComponent.example = example;
        } else if (media && media.url) {
          // Use the provided URL - ensure it's accessible and correct format
          processedComponent.example = {
            header_url: [media.url]
          };
        } else if (media && media.handle) {
          // Use the provided media handle/ID
          processedComponent.example = {
            header_handle: [media.handle]
          };
        } else {
          // Use working sample URLs with proper file extensions
          const sampleUrl = format === 'IMAGE'
            ? "https://via.placeholder.com/800x600.jpg"
            : format === 'VIDEO'
            ? "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
            : "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";

          processedComponent.example = {
            header_url: [sampleUrl]
          };
        }
        break;

      case 'LOCATION':
        if (!location) {
          throw new ApiError(400, 'Location header must have location data');
        }
        processedComponent.location = location;
        break;

      default:
        throw new ApiError(400, `Unsupported header format: ${format}`);
    }
  }

  /**
   * Process body component
   */
  processBodyComponent(processedComponent, component) {
    const { text, add_security_recommendation, example } = component;

    if (text) {
      if (text.length > 1024) {
        throw new ApiError(400, 'Body text must be 1024 characters or less');
      }
      processedComponent.text = text;

      // Handle direct example format or generate from variables
      if (example) {
        // Use the provided example directly (exact API v22 format)
        processedComponent.example = example;
      } else {
        // Add example for variables - Meta API expects specific format
        const variables = this.extractVariables(text);
        if (variables.length > 0) {
          processedComponent.example = {
            body_text: [variables.map((_, index) => `Body Variable ${index + 1}`)]
          };
        }
      }
    } else if (add_security_recommendation) {
      // For authentication templates without text, Meta API generates the body
      processedComponent.add_security_recommendation = true;
    }

    // For authentication templates
    if (add_security_recommendation && text) {
      processedComponent.add_security_recommendation = true;
    }
  }

  /**
   * Process footer component
   */
  processFooterComponent(processedComponent, component) {
    const { text, code_expiration_minutes } = component;

    if (text) {
      if (text.length > 60) {
        throw new ApiError(400, 'Footer text must be 60 characters or less');
      }
      processedComponent.text = text;
    }

    // For authentication templates
    if (code_expiration_minutes) {
      processedComponent.code_expiration_minutes = code_expiration_minutes;
    }
  }

  /**
   * Process buttons component with all button types
   */
  processButtonsComponent(processedComponent, component) {
    const { buttons } = component;

    if (!buttons || !Array.isArray(buttons) || buttons.length === 0) {
      throw new ApiError(400, 'Buttons component must have at least one button');
    }

    if (buttons.length > 10) {
      throw new ApiError(400, 'Maximum 10 buttons allowed');
    }

    processedComponent.buttons = buttons.map(button => {
      const processedButton = { type: button.type.toUpperCase() };

      switch (button.type.toUpperCase()) {
        case 'QUICK_REPLY':
          if (!button.text || button.text.length > 25) {
            throw new ApiError(400, 'Quick reply button text must be 1-25 characters');
          }
          processedButton.text = button.text;
          break;

        case 'URL':
          if (!button.text || button.text.length > 25) {
            throw new ApiError(400, 'URL button text must be 1-25 characters');
          }
          if (!button.url) {
            throw new ApiError(400, 'URL button must have a URL');
          }
          processedButton.text = button.text;
          processedButton.url = button.url;

          // Add example for dynamic URLs
          if (button.url.includes('{{')) {
            const urlVariables = this.extractVariables(button.url);
            if (urlVariables.length > 0) {
              processedButton.example = urlVariables.map((_, index) => `url_param_${index + 1}`);
            }
          }
          break;

        case 'PHONE_NUMBER':
          if (!button.text || button.text.length > 25) {
            throw new ApiError(400, 'Phone button text must be 1-25 characters');
          }
          if (!button.phone_number) {
            throw new ApiError(400, 'Phone button must have a phone number');
          }
          processedButton.text = button.text;
          processedButton.phone_number = button.phone_number;
          break;

        case 'OTP':
          if (!button.otp_type) {
            throw new ApiError(400, 'OTP button must have otp_type');
          }
          processedButton.otp_type = button.otp_type.toUpperCase();
          if (button.text) {
            processedButton.text = button.text;
          }
          // Add additional OTP button properties
          if (button.autofill_text) {
            processedButton.autofill_text = button.autofill_text;
          }
          if (button.package_name) {
            processedButton.package_name = button.package_name;
          }
          if (button.signature_hash) {
            processedButton.signature_hash = button.signature_hash;
          }
          break;

        case 'COPY_CODE':
          if (button.example) {
            processedButton.example = button.example;
          }
          break;

        case 'FLOW':
          if (!button.flow_id && !button.flow_name && !button.flow_json) {
            throw new ApiError(400, 'Flow button must have flow_id, flow_name, or flow_json');
          }
          if (button.flow_id) processedButton.flow_id = button.flow_id;
          if (button.flow_name) processedButton.flow_name = button.flow_name;
          if (button.flow_json) processedButton.flow_json = button.flow_json;
          if (button.flow_action) processedButton.flow_action = button.flow_action;
          if (button.navigate_screen) processedButton.navigate_screen = button.navigate_screen;
          break;

        default:
          throw new ApiError(400, `Unsupported button type: ${button.type}`);
      }

      return processedButton;
    });
  }

  /**
   * Build legacy components for backward compatibility
   */
  async buildLegacyComponents({ body, footer_text, header, action_buttons }) {
    const components = [];

    // Add header if provided
    if (header && header.type !== 'none') {
      const headerComponent = { type: 'HEADER' };

      if (header.type === 'text') {
        headerComponent.format = 'TEXT';
        headerComponent.text = header.text;

        const headerVariables = this.extractVariables(header.text);
        if (headerVariables.length > 0) {
          headerComponent.example = {
            header_text: headerVariables.map((_, index) => `Header Variable ${index + 1}`)
          };
        }
      } else if (header.type === 'media') {
        headerComponent.format = header.media.type.toUpperCase();

        // Use URLs or handles for media headers with proper file extensions
        if (header.media.url) {
          headerComponent.example = {
            header_handle: [header.media.url]
          };
        } else if (header.media.handle) {
          headerComponent.example = {
            header_handle: [header.media.handle]
          };
        } else {
          // Use working sample URLs with proper file extensions for API v22
          const sampleUrl = header.media.type === 'image'
            ? "https://via.placeholder.com/800x600.jpg"
            : header.media.type === 'video'
            ? "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
            : "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";

          headerComponent.example = {
            header_handle: [sampleUrl]
          };
        }
      }

      components.push(headerComponent);
    }

    // Add body (required)
    if (body) {
      const bodyComponent = {
        type: 'BODY',
        text: body
      };

      const bodyVariables = this.extractVariables(body);
      if (bodyVariables.length > 0) {
        bodyComponent.example = {
          body_text: [bodyVariables.map((_, index) => `Body Variable ${index + 1}`)]
        };
      }

      components.push(bodyComponent);
    }

    // Add footer if provided
    if (footer_text) {
      components.push({
        type: 'FOOTER',
        text: footer_text
      });
    }

    // Add buttons if provided
    if (action_buttons && action_buttons.length > 0) {
      const buttonsComponent = {
        type: 'BUTTONS',
        buttons: action_buttons.map(button => ({
          type: button.type.toUpperCase(),
          text: button.text,
          ...(button.url && { url: button.url }),
          ...(button.phone_number && { phone_number: button.phone_number })
        }))
      };

      components.push(buttonsComponent);
    }

    return components;
  }

  /**
   * Count variables in all components
   */
  countVariablesInComponents(components) {
    let count = 0;

    for (const component of components) {
      if (component.text) {
        count += this.extractVariables(component.text).length;
      }
      if (component.buttons) {
        for (const button of component.buttons) {
          if (button.url) {
            count += this.extractVariables(button.url).length;
          }
        }
      }
    }

    return count;
  }

  /**
   * Create template in Meta API with comprehensive support
   */
  async createTemplate(userId, templateData) {
    try {
      // Check user permissions for creating WhatsApp Official templates
      const user = await this.checkTemplatePermissions(userId, 'canCreateWhatsAppOfficialTemplates');

      // Get WhatsApp configuration
      const config = await this.getWhatsAppConfig(userId);

      // Process template data with comprehensive support
      const processedData = await this.processTemplateData(templateData, userId);

      // Create template in Meta API
      const url = `${this.baseUrl}/${config.whatsappBusinessAccountId}/message_templates`;
      const headers = {
        'Authorization': `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json'
      };

      logger.info('Creating comprehensive template in Meta API:', {
        templateName: processedData.metaTemplate.name,
        businessAccountId: config.whatsappBusinessAccountId,
        componentCount: processedData.metaTemplate.components.length,
        variableCount: processedData.variableCount
      });

      const response = await axios.post(url, processedData.metaTemplate, { headers });

      logger.info('Template created successfully in Meta API:', {
        templateId: response.data.id,
        templateName: response.data.name,
        status: response.data.status,
        category: response.data.category
      });

      // Deduct credits after successful template creation
      let creditTransaction = null;
      if (processedData.campaignCategory) {
        creditTransaction = await this.deductTemplateCredits(
          userId,
          processedData.campaign_category_id,
          processedData.creditCost,
          response.data.id
        );
      }

      // Save template information to local database
      const localTemplate = new MetaTemplate({
        meta_template_id: response.data.id,
        template_name: processedData.metaTemplate.name,
        language: processedData.metaTemplate.language,
        category: response.data.category,
        status: response.data.status,
        components: processedData.metaTemplate.components,
        created_by: userId,
        created_by_username: user.username,
        created_by_role: user.role,
        whatsapp_business_account_id: config.whatsappBusinessAccountId,
        whatsapp_config_id: config._id,
        whatsapp_official_category_id: processedData.whatsapp_official_category_id,
        campaign_category_id: processedData.campaign_category_id,
        credit_cost: processedData.creditCost,
        credits_deducted: processedData.campaignCategory ? processedData.creditCost : 0,
        credit_transaction_id: creditTransaction?._id,
        parameter_format: 'POSITIONAL',
        variable_count: processedData.variableCount,
        meta_api_response: response.data,
        last_sync_at: new Date(),
        sync_status: 'synced'
      });

      await localTemplate.save();

      logger.info('Template saved to local database:', {
        localId: localTemplate._id,
        metaId: response.data.id,
        templateName: processedData.metaTemplate.name
      });

      return {
        id: response.data.id,
        name: processedData.metaTemplate.name,
        status: response.data.status,
        category: response.data.category,
        language: processedData.metaTemplate.language,
        components: processedData.metaTemplate.components,
        created_at: new Date().toISOString(),
        credit_info: {
          credits_deducted: processedData.campaignCategory ? processedData.creditCost : 0,
          campaign_category: processedData.campaignCategory?.name,
          transaction_id: creditTransaction?._id
        },
        whatsapp_category: processedData.whatsappCategory?.name,
        created_by: {
          id: user._id,
          username: user.username,
          role: user.role
        },
        local_id: localTemplate._id,
        local_saved: true
      };

    } catch (error) {
      logger.error('Failed to create template in Meta API:', error);
      throw new ApiError(400, `Meta API Error: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Check template credits before creation
   */
  async checkTemplateCredits(userId, categoryId, creditCost) {
    const user = await User.findById(userId);
    if (user.role === 'super_admin' || (user.rolePermissions && user.rolePermissions.hasUnlimitedCredits)) {
      return true; // Super admin or unlimited credits
    }

    const credit = await Credit.findOne({ userId, categoryId });
    if (!credit) {
      throw new ApiError(400, 'No credits found for this category');
    }

    if (credit.isUnlimited) {
      return true;
    }

    if (credit.credit < creditCost) {
      throw new ApiError(400, `Insufficient credits. Required: ${creditCost}, Available: ${credit.credit}`);
    }

    return true;
  }

  /**
   * Deduct template credits after successful creation
   */
  async deductTemplateCredits(userId, categoryId, creditCost, templateId) {
    const user = await User.findById(userId);
    if (user.role === 'super_admin' || (user.rolePermissions && user.rolePermissions.hasUnlimitedCredits)) {
      return null; // No deduction for super admin or unlimited credits
    }

    const credit = await Credit.findOne({ userId, categoryId });
    if (!credit || credit.isUnlimited) {
      return null;
    }

    // Deduct credits
    credit.credit -= creditCost;
    await credit.save();

    // Create transaction record
    const transaction = new CreditTransaction({
      userId,
      categoryId,
      creditUsed: creditCost,
      transactionType: 'debit',
      description: `Template creation: ${templateId}`,
      balanceAfter: credit.credit
    });

    await transaction.save();

    logger.info('Credits deducted for template creation:', {
      userId,
      templateId,
      creditCost,
      remainingCredits: credit.credit
    });

    return transaction;
  }

  /**
   * Get templates from Meta API
   */
  async getTemplates(userId, options = {}) {
    try {
      // Check user permissions
      await this.checkTemplatePermissions(userId, 'canViewWhatsAppOfficialTemplates');

      // Get WhatsApp configuration
      const config = await this.getWhatsAppConfig(userId);

      const { limit = 25, after, include_credit_info = false } = options;

      // Build URL with pagination
      let url = `${this.baseUrl}/${config.whatsappBusinessAccountId}/message_templates?limit=${limit}`;
      if (after) {
        url += `&after=${after}`;
      }

      const headers = {
        'Authorization': `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json'
      };

      logger.info('Fetching templates from Meta API:', {
        businessAccountId: config.whatsappBusinessAccountId,
        limit,
        after
      });

      const response = await axios.get(url, { headers });

      return {
        data: response.data.data || [],
        paging: response.data.paging || {}
      };

    } catch (error) {
      logger.error('Failed to get templates from Meta API:', error);
      throw new ApiError(400, `Meta API Error: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Get all templates with full details from Meta API
   */
  async getAllTemplatesWithDetails(userId, options = {}) {
    try {
      // Check user permissions
      await this.checkTemplatePermissions(userId, 'canViewWhatsAppOfficialTemplates');

      // Get WhatsApp configuration
      const config = await this.getWhatsAppConfig(userId);

      const allTemplates = [];
      let after = null;
      let hasNextPage = true;

      while (hasNextPage) {
        let url = `${this.baseUrl}/${config.whatsappBusinessAccountId}/message_templates?limit=100`;
        if (after) {
          url += `&after=${after}`;
        }

        const headers = {
          'Authorization': `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json'
        };

        const response = await axios.get(url, { headers });
        const templates = response.data.data || [];
        
        allTemplates.push(...templates);

        // Check if there's a next page
        if (response.data.paging && response.data.paging.next) {
          after = response.data.paging.cursors?.after;
        } else {
          hasNextPage = false;
        }
      }

      logger.info('Retrieved all templates from Meta API:', {
        totalCount: allTemplates.length,
        businessAccountId: config.whatsappBusinessAccountId
      });

      return {
        data: allTemplates,
        total: allTemplates.length,
        fetched_at: new Date().toISOString()
      };

    } catch (error) {
      logger.error('Failed to get all templates from Meta API:', error);
      throw new ApiError(400, `Meta API Error: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Get single template from Meta API
   */
  async getTemplate(userId, templateId) {
    try {
      // Check user permissions
      await this.checkTemplatePermissions(userId, 'canViewWhatsAppOfficialTemplates');

      // Get WhatsApp configuration
      const config = await this.getWhatsAppConfig(userId);

      const url = `${this.baseUrl}/${templateId}`;
      const headers = {
        'Authorization': `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json'
      };

      logger.info('Fetching single template from Meta API:', {
        templateId,
        businessAccountId: config.whatsappBusinessAccountId
      });

      const response = await axios.get(url, { headers });
      return response.data;

    } catch (error) {
      logger.error('Failed to get template from Meta API:', error);
      throw new ApiError(400, `Meta API Error: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Delete template from Meta API
   */
  async deleteTemplate(userId, templateId) {
    try {
      // Check user permissions
      await this.checkTemplatePermissions(userId, 'canDeleteWhatsAppOfficialTemplates');

      // Get WhatsApp configuration
      const config = await this.getWhatsAppConfig(userId);

      const url = `${this.baseUrl}/${templateId}`;
      const headers = {
        'Authorization': `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json'
      };

      logger.info('Deleting template from Meta API:', {
        templateId,
        businessAccountId: config.whatsappBusinessAccountId
      });

      await axios.delete(url, { headers });

      return {
        message: 'Template deleted successfully from Meta API'
      };

    } catch (error) {
      logger.error('Failed to delete template from Meta API:', error);
      throw new ApiError(400, `Meta API Error: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Extract variables from text ({{1}}, {{2}}, etc.)
   */
  extractVariables(text) {
    if (!text) return [];
    const matches = text.match(/\{\{\d+\}\}/g);
    return matches || [];
  }
}

module.exports = new MetaTemplateService();
