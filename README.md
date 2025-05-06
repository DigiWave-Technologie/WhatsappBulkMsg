# WhatsApp Bulk Messaging System

A comprehensive WhatsApp bulk messaging system with role-based access control, template management, campaign management, and API integration.

## Features

- **User Management**
  - Role-based access control (Super Admin, Admin, Reseller, User)
  - User authentication and authorization
  - API key management for developers

- **Template Management**
  - Create and manage message templates
  - Template approval workflow
  - Variable support in templates
  - Template categories and languages

- **Campaign Management**
  - Create and schedule campaigns
  - Bulk message sending
  - Media support (images, documents, videos)
  - Campaign analytics and reporting

- **Credit System**
  - Credit management for users
  - Credit transfer between users
  - Credit usage tracking
  - Unlimited credits for Super Admin

- **API Integration**
  - RESTful API for developers
  - API key authentication
  - Rate limiting
  - Comprehensive documentation

- **Security Features**
  - JWT authentication
  - Role-based permissions
  - API key management
  - Rate limiting
  - Input validation

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- WhatsApp Business API access
- SMTP server for email notifications

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/whatsapp-bulk-campaign.git
   cd whatsapp-bulk-campaign
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit the `.env` file with your configuration.

4. Start the server:
   ```bash
   npm start
   ```

## API Documentation

### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/change-password` - Change password
- `POST /api/auth/generate-api-key` - Generate API key
- `POST /api/auth/revoke-api-key` - Revoke API key

### Templates

- `GET /api/templates` - Get all templates
- `GET /api/templates/:id` - Get template by ID
- `POST /api/templates` - Create template
- `PUT /api/templates/:id` - Update template
- `DELETE /api/templates/:id` - Delete template
- `POST /api/templates/:id/approve` - Approve template
- `POST /api/templates/:id/reject` - Reject template

### Campaigns

- `GET /api/campaigns` - Get all campaigns
- `GET /api/campaigns/:id` - Get campaign by ID
- `POST /api/campaigns` - Create campaign
- `PUT /api/campaigns/:id` - Update campaign
- `DELETE /api/campaigns/:id` - Delete campaign
- `POST /api/campaigns/:id/start` - Start campaign
- `POST /api/campaigns/:id/pause` - Pause campaign
- `POST /api/campaigns/:id/resume` - Resume campaign
- `POST /api/campaigns/:id/stop` - Stop campaign

### Credits

- `GET /api/credits` - Get user credits
- `POST /api/credits/transfer` - Transfer credits
- `GET /api/credits/transactions` - Get credit transactions
- `GET /api/credits/usage` - Get credit usage statistics

### Developer API

- `POST /api/v1/messages` - Send message
- `POST /api/v1/templates` - Create template
- `GET /api/v1/templates` - Get templates
- `POST /api/v1/campaigns` - Create campaign
- `GET /api/v1/campaigns` - Get campaigns
- `GET /api/v1/reports` - Get reports
- `GET /api/v1/credits` - Get credits
- `GET /api/v1/transactions` - Get transactions

## Role Permissions

### Super Admin
- Full system access
- User management
- Credit management
- Template approval
- Campaign management
- API key management
- System settings

### Admin
- User management
- Credit management
- Template approval
- Campaign management
- Analytics access

### Reseller
- Credit management
- Template management
- Campaign management
- Analytics access

### User
- Template management
- Campaign management
- Analytics access

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@whatsapp-bulk.com or create an issue in the repository. 

async validateNumber(phoneNumber) {
    try {
        const response = await this.client.get(`/phone_numbers/${phoneNumber}`);
        return response.data;
    } catch (error) {
        throw new Error(`Failed to validate number: ${error.message}`);
    }
}

async getBusinessProfile() {
    try {
        const response = await this.client.get('/business_profile');
        return response.data;
    } catch (error) {
        throw new Error(`Failed to get business profile: ${error.message}`);
    }
}

async updateBusinessProfile(profileData) {
    try {
        const response = await this.client.post('/business_profile', profileData);
        return response.data;
    } catch (error) {
        throw new Error(`Failed to update business profile: ${error.message}`);
    }
} 

const Template = require('../models/Template');
const { checkPermission } = require('../utils/permissions');
const { asyncHandler } = require('../middleware/errorHandler');

class TemplateService {
  // Get all templates
  async getTemplates(user) {
    const query = {};
    
    const templates = await Template.find(query)
      .populate('createdBy', 'username email')
      .sort({ createdAt: -1 });
    return templates;
  }

  // Get template by ID
  async getTemplateById(templateId, user) {
    const template = await Template.findById(templateId)
      .populate('createdBy', 'username email');
    return template;
  }

  // Create new template
  async createTemplate(templateData, userId) {
    try {
      // Create template
      const template = new Template({
        ...templateData,
        userId,
        status: 'pending',
        createdAt: new Date()
      });

      await template.save();
      return template;
    } catch (error) {
      throw new Error(`Failed to create template: ${error.message}`);
    }
  }

  // Update template
  async updateTemplate(templateId, templateData, userId) {
    try {
      const template = await this.getTemplateById(templateId, userId);
      if (!template) {
        throw new Error('Template not found');
      }

      // Only allow updates if template is pending or rejected
      if (template.status !== 'pending' && template.status !== 'rejected') {
        throw new Error('Cannot update approved template');
      }

      // Update template fields
      Object.assign(template, templateData);
      template.status = 'pending'; // Reset status to pending after update
      template.updatedAt = new Date();

      await template.save();
      return template;
    } catch (error) {
      throw new Error(`Failed to update template: ${error.message}`);
    }
  }

  // Delete template
  async deleteTemplate(templateId, userId) {
    try {
      const template = await this.getTemplateById(templateId, userId);
      if (!template) {
        throw new Error('Template not found');
      }

      if (template.status === 'approved') {
        throw new Error('Cannot delete approved template');
      }

      await template.remove();
      return { message: 'Template deleted successfully' };
    } catch (error) {
      throw new Error(`Failed to delete template: ${error.message}`);
    }
  }

  // Approve template
  async approveTemplate(templateId, approverId) {
    try {
      const template = await Template.findById(templateId);
      if (!template) {
        throw new Error('Template not found');
      }

      if (template.status !== 'pending') {
        throw new Error('Template must be pending to approve');
      }

      template.status = 'approved';
      template.approvedBy = approverId;
      template.approvedAt = new Date();
      await template.save();

      return template;
    } catch (error) {
      throw new Error(`Failed to approve template: ${error.message}`);
    }
  }

  // Reject template
  async rejectTemplate(templateId, approverId, rejectionReason) {
    try {
      const template = await Template.findById(templateId);
      if (!template) {
        throw new Error('Template not found');
      }

      if (template.status !== 'pending') {
        throw new Error('Template must be pending to reject');
      }

      template.status = 'rejected';
      template.rejectedBy = approverId;
      template.rejectionReason = rejectionReason;
      template.rejectedAt = new Date();
      await template.save();

      return template;
    } catch (error) {
      throw new Error(`Failed to reject template: ${error.message}`);
    }
  }

  async processTemplate(template, variables) {
    // Implementation of processTemplate method
  }

  async getUserTemplates(userId, filters = {}) {
    try {
      const query = { userId, ...filters };
      const templates = await Template.find(query).sort({ createdAt: -1 });
      return templates;
    } catch (error) {
      throw new Error(`Failed to get templates: ${error.message}`);
    }
  }

  async getPendingTemplates() {
    try {
      const templates = await Template.find({ status: 'pending' })
        .sort({ createdAt: -1 })
        .populate('userId', 'username email');
      return templates;
    } catch (error) {
      throw new Error(`Failed to get pending templates: ${error.message}`);
    }
  }

  async validateTemplate(templateData) {
    try {
      // Check required fields
      if (!templateData.name || !templateData.content || !templateData.category || !templateData.language) {
        throw new Error('Missing required fields');
      }

      // Validate template name format
      if (!/^[a-zA-Z0-9_-]+$/.test(templateData.name)) {
        throw new Error('Template name can only contain letters, numbers, underscores, and hyphens');
      }

      // Validate content length
      if (templateData.content.length > 4096) {
        throw new Error('Template content exceeds maximum length of 4096 characters');
      }

      // Validate variables format
      if (templateData.variables) {
        const variables = templateData.variables.split(',');
        for (const variable of variables) {
          if (!/^[a-zA-Z0-9_]+$/.test(variable.trim())) {
            throw new Error('Invalid variable format');
          }
        }
      }

      return true;
    } catch (error) {
      throw new Error(`Template validation failed: ${error.message}`);
    }
  }
}

module.exports = new TemplateService(); 