const axios = require('axios');
const logger = require('../utils/logger');
const WhatsAppConfig = require('../models/WhatsAppConfig');
const WhatsAppOfficialCategory = require('../models/WhatsAppOfficialCategory');
const Category = require('../models/Category');
const User = require('../models/User');
const { Credit, CreditTransaction } = require('../models/Credit');
const { ApiError } = require('../utils/ApiError');
const { checkPermission } = require('../utils/permissions');

class MetaTemplateService {
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
   * Check user permissions for template management
   */
  async checkTemplatePermissions(userId, action = 'manage_templates') {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    // Check role-based permissions
    if (!checkPermission(user, action)) {
      throw new ApiError(403, `Insufficient permissions for ${action}`);
    }

    return user;
  }

  /**
   * Check and deduct credits for template creation
   */
  async checkTemplateCredits(userId, categoryId, creditCost = 1) {
    const user = await User.findById(userId);

    // Super admin has unlimited credits
    if (user.role === 'super_admin') {
      return { unlimited: true };
    }

    // Check user credits
    const userCredit = await Credit.findOne({ userId, categoryId });
    if (!userCredit || (!userCredit.isUnlimited && userCredit.credit < creditCost)) {
      throw new ApiError(402, 'Insufficient credits for template creation');
    }

    return userCredit;
  }

  /**
   * Deduct credits for template creation
   */
  async deductTemplateCredits(userId, categoryId, creditCost = 1, templateId = null) {
    const user = await User.findById(userId);

    // Skip for super admin
    if (user.role === 'super_admin') {
      return { success: true, message: 'Super Admin has unlimited credits' };
    }

    const userCredit = await Credit.findOne({ userId, categoryId });

    if (!userCredit.isUnlimited) {
      userCredit.credit -= creditCost;
      userCredit.lastUsed = new Date();
      await userCredit.save();
    }

    // Create transaction record
    const transaction = new CreditTransaction({
      fromUserId: userId,
      toUserId: userId,
      categoryId,
      creditType: 'debit',
      credit: creditCost,
      description: `Template creation: ${templateId || 'Meta API Template'}`,
      metadata: { templateId, action: 'template_creation' }
    });

    await transaction.save();
    return transaction;
  }

  /**
   * Create template directly in Meta API with credit integration
   */
  async createTemplate(userId, templateData) {
    try {
      const {
        template_name,
        language,
        category = 'MARKETING',
        body,
        footer_text,
        header,
        action_buttons,
        whatsapp_business_account_id,
        whatsapp_official_category_id,
        campaign_category_id
      } = templateData;

      // Check user permissions
      const user = await this.checkTemplatePermissions(userId, 'manage_templates');

      // Validate required fields
      if (!template_name || !language || !body) {
        throw new ApiError(400, 'Missing required fields: template_name, language, body');
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

      // Build Meta API template structure
      const metaTemplate = {
        name: template_name,
        language: language,
        category: category.toUpperCase(),
        components: []
      };

      // Add header component if provided
      if (header && header.type !== 'none') {
        const headerComponent = { type: 'HEADER' };
        
        if (header.type === 'text') {
          headerComponent.format = 'TEXT';
          headerComponent.text = header.text;
          
          // Extract variables from header text
          const headerVariables = this.extractVariables(header.text);
          if (headerVariables.length > 0) {
            headerComponent.example = {
              header_text: headerVariables.map((_, index) => `Header Variable ${index + 1}`)
            };
          }
        } else if (header.type === 'media') {
          headerComponent.format = header.media.type.toUpperCase();
          if (header.media.type === 'image') {
            headerComponent.example = {
              header_handle: [header.media.url || 'https://example.com/image.jpg']
            };
          }
        }
        
        metaTemplate.components.push(headerComponent);
      }

      // Add body component
      const bodyComponent = {
        type: 'BODY',
        text: body
      };

      // Extract variables from body text
      const variables = this.extractVariables(body);
      if (variables.length > 0) {
        bodyComponent.example = {
          body_text: [variables.map((_, index) => `Variable ${index + 1}`)]
        };
      }

      metaTemplate.components.push(bodyComponent);

      // Add footer component if provided
      if (footer_text) {
        metaTemplate.components.push({
          type: 'FOOTER',
          text: footer_text
        });
      }

      // Add action buttons if provided
      if (action_buttons && action_buttons.length > 0) {
        const buttonComponent = {
          type: 'BUTTONS',
          buttons: action_buttons.map(button => ({
            type: button.type.toUpperCase(),
            text: button.text,
            ...(button.url && { url: button.url }),
            ...(button.phone_number && { phone_number: button.phone_number })
          }))
        };
        metaTemplate.components.push(buttonComponent);
      }

      // Create template in Meta API
      const url = `${this.baseUrl}/${config.whatsappBusinessAccountId}/message_templates`;
      const headers = {
        'Authorization': `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json'
      };

      logger.info('Creating template directly in Meta API:', {
        templateName: template_name,
        businessAccountId: config.whatsappBusinessAccountId,
        tokenEnd: config.accessToken.slice(-20)
      });

      const response = await axios.post(url, metaTemplate, { headers });
      
      // Validate Meta API response
      if (!response.data || !response.data.id) {
        throw new ApiError(500, 'Invalid response from Meta API: Missing template ID');
      }
      
      logger.info('Template created successfully in Meta API:', {
        templateId: response.data.id,
        status: response.data.status,
        category: response.data.category,
        userId,
        userName: user.username
      });

      // Deduct credits after successful template creation
      let creditTransaction = null;
      if (campaignCategory) {
        creditTransaction = await this.deductTemplateCredits(
          userId,
          campaign_category_id,
          creditCost,
          response.data.id
        );
      }

      return {
        id: response.data.id,
        name: template_name,
        status: response.data.status,
        category: response.data.category,
        language: language,
        components: metaTemplate.components,
        created_at: new Date().toISOString(),
        credit_info: {
          credits_deducted: campaignCategory ? creditCost : 0,
          campaign_category: campaignCategory?.name,
          transaction_id: creditTransaction?._id
        },
        whatsapp_category: whatsappCategory?.name,
        created_by: {
          id: user._id,
          username: user.username,
          role: user.role
        }
      };

    } catch (error) {
      if (error.response?.data?.error) {
        const metaError = error.response.data.error;
        logger.error('Meta API template creation failed:', {
          error: metaError,
          templateName: templateData.template_name,
          status: error.response.status
        });
        throw new ApiError(400, `Meta API Error: ${metaError.message || metaError.error_user_msg || 'Unknown error'}`);
      }
      
      logger.error('Template creation failed:', error);
      throw error;
    }
  }

  /**
   * Get all templates from Meta API with role-based filtering
   */
  async getTemplates(userId, options = {}) {
    try {
      const { limit = 25, after, include_credit_info = false } = options;

      // Check user permissions
      const user = await this.checkTemplatePermissions(userId, 'manage_templates');

      // Get WhatsApp configuration
      const config = await this.getWhatsAppConfig(userId);

      const url = `${this.baseUrl}/${config.whatsappBusinessAccountId}/message_templates`;
      const headers = {
        'Authorization': `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json'
      };

      const params = { limit };
      if (after) params.after = after;

      const response = await axios.get(url, { headers, params });

      let templates = response.data.data || [];

      // Add credit information if requested
      if (include_credit_info) {
        templates = await Promise.all(templates.map(async (template) => {
          // Get credit transactions for this template
          const transactions = await CreditTransaction.find({
            'metadata.templateId': template.id,
            'metadata.action': 'template_creation'
          }).populate('categoryId', 'name creditCost');

          return {
            ...template,
            credit_info: transactions.map(t => ({
              credits_used: t.credit,
              category: t.categoryId?.name,
              created_at: t.createdAt
            }))
          };
        }));
      }

      return {
        data: templates,
        paging: response.data.paging || {},
        total: templates.length,
        user_info: {
          id: user._id,
          username: user.username,
          role: user.role
        }
      };

    } catch (error) {
      logger.error('Failed to get templates from Meta API:', error);
      throw new ApiError(400, `Meta API Error: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Get single template from Meta API
   */
  async getTemplate(userId, templateId) {
    try {
      // Get WhatsApp configuration
      const config = await this.getWhatsAppConfig(userId);

      const url = `${this.baseUrl}/${templateId}`;
      const headers = {
        'Authorization': `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json'
      };

      const response = await axios.get(url, { headers });
      return response.data;

    } catch (error) {
      if (error.response?.status === 404) {
        throw new ApiError(404, 'Template not found');
      }
      logger.error('Failed to get template from Meta API:', error);
      throw new ApiError(400, `Meta API Error: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Delete template from Meta API
   */
  async deleteTemplate(userId, templateId) {
    try {
      // Get WhatsApp configuration
      const config = await this.getWhatsAppConfig(userId);

      // First get the template to find its name
      const template = await this.getTemplate(userId, templateId);

      // Meta API delete endpoint format: DELETE /{business-account-id}/message_templates?name={template-name}
      const url = `${this.baseUrl}/${config.whatsappBusinessAccountId}/message_templates`;
      const headers = {
        'Authorization': `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json'
      };

      const params = {
        name: template.name
      };

      const response = await axios.delete(url, { headers, params });

      logger.info('Template deleted from Meta API:', {
        templateId,
        templateName: template.name,
        success: response.data.success
      });

      return {
        success: true,
        message: 'Template deleted successfully',
        templateName: template.name
      };

    } catch (error) {
      if (error.response?.status === 404) {
        throw new ApiError(404, 'Template not found');
      }
      logger.error('Failed to delete template from Meta API:', error);
      throw new ApiError(400, `Meta API Error: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Get all templates with full details from Meta API
   */
  async getAllTemplatesWithDetails(userId, options = {}) {
    try {
      const { include_credit_info = false } = options;

      // Check user permissions for viewing WhatsApp Official templates
      const user = await this.checkTemplatePermissions(userId, 'canViewWhatsAppOfficialTemplates');

      // Get WhatsApp configuration
      const config = await this.getWhatsAppConfig(userId);

      let allTemplates = [];
      let after = null;
      let hasMore = true;

      // Fetch all templates with pagination
      while (hasMore) {
        const url = `${this.baseUrl}/${config.whatsappBusinessAccountId}/message_templates`;
        const headers = {
          'Authorization': `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json'
        };

        const params = {
          limit: 100, // Maximum allowed by Meta API
          ...(after && { after })
        };

        const response = await axios.get(url, { headers, params });
        const templates = response.data.data || [];

        allTemplates = allTemplates.concat(templates);

        // Check if there are more pages
        hasMore = response.data.paging && response.data.paging.next;
        after = response.data.paging?.cursors?.after;
      }

      logger.info('Retrieved all templates with full details:', {
        userId,
        totalTemplates: allTemplates.length
      });

      return {
        success: true,
        data: allTemplates,
        total: allTemplates.length,
        fetched_at: new Date().toISOString()
      };

    } catch (error) {
      logger.error('Failed to get all templates with details from Meta API:', error);
      throw new ApiError(400, `Meta API Error: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Delete multiple templates from Meta API
   */
  async deleteMultipleTemplates(userId, templateIds) {
    try {
      if (!Array.isArray(templateIds) || templateIds.length === 0) {
        throw new ApiError(400, 'Template IDs must be a non-empty array');
      }

      const results = [];
      const errors = [];

      // Process deletions sequentially to avoid rate limiting
      for (const templateId of templateIds) {
        try {
          const result = await this.deleteTemplate(userId, templateId);
          results.push({
            templateId,
            success: true,
            message: result.message,
            templateName: result.templateName
          });
        } catch (error) {
          errors.push({
            templateId,
            success: false,
            error: error.message
          });
        }
      }

      logger.info('Bulk template deletion completed:', {
        userId,
        totalRequested: templateIds.length,
        successful: results.length,
        failed: errors.length
      });

      return {
        success: true,
        message: `Bulk deletion completed: ${results.length} successful, ${errors.length} failed`,
        results,
        errors,
        summary: {
          total: templateIds.length,
          successful: results.length,
          failed: errors.length
        }
      };

    } catch (error) {
      logger.error('Bulk template deletion failed:', error);
      throw error;
    }
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
}

module.exports = new MetaTemplateService();
