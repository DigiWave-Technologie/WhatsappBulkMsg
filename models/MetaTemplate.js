const mongoose = require('mongoose');

const metaTemplateSchema = new mongoose.Schema({
  // Meta API Information
  meta_template_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  template_name: {
    type: String,
    required: true,
    index: true
  },
  language: {
    type: String,
    required: true,
    default: 'en_US'
  },
  category: {
    type: String,
    required: true,
    enum: ['MARKETING', 'UTILITY', 'AUTHENTICATION'],
    default: 'MARKETING'
  },
  status: {
    type: String,
    required: true,
    enum: ['PENDING', 'APPROVED', 'REJECTED', 'PAUSED', 'DISABLED'],
    default: 'PENDING',
    index: true
  },
  
  // Template Content
  components: [{
    type: {
      type: String,
      enum: ['HEADER', 'BODY', 'FOOTER', 'BUTTONS'],
      required: true
    },
    format: String, // For HEADER: TEXT, IMAGE, VIDEO, DOCUMENT
    text: String,
    example: mongoose.Schema.Types.Mixed,
    buttons: [{
      type: {
        type: String,
        enum: ['QUICK_REPLY', 'URL', 'PHONE_NUMBER']
      },
      text: String,
      url: String,
      phone_number: String
    }]
  }],
  
  // User Information
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  created_by_username: {
    type: String,
    required: true
  },
  created_by_role: {
    type: String,
    required: true,
    enum: ['super_admin', 'admin', 'reseller', 'user']
  },
  
  // WhatsApp Configuration
  whatsapp_business_account_id: {
    type: String,
    required: true
  },
  whatsapp_config_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WhatsAppConfig'
  },
  
  // Category References
  whatsapp_official_category_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WhatsAppOfficialCategory'
  },
  campaign_category_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },
  
  // Credit Information
  credit_cost: {
    type: Number,
    default: 0
  },
  credits_deducted: {
    type: Number,
    default: 0
  },
  credit_transaction_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CreditTransaction'
  },
  
  // Meta API Sync Information
  last_sync_at: {
    type: Date,
    default: Date.now
  },
  sync_status: {
    type: String,
    enum: ['synced', 'pending_sync', 'sync_failed'],
    default: 'synced'
  },
  sync_error: String,
  
  // Template Analytics
  usage_count: {
    type: Number,
    default: 0
  },
  last_used_at: Date,
  
  // Audit Information
  is_active: {
    type: Boolean,
    default: true
  },
  deleted_at: Date,
  deleted_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Additional Metadata
  parameter_format: {
    type: String,
    enum: ['POSITIONAL', 'NAMED'],
    default: 'POSITIONAL'
  },
  variable_count: {
    type: Number,
    default: 0
  },
  
  // Meta API Response Data
  meta_api_response: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
metaTemplateSchema.index({ created_by: 1, status: 1 });
metaTemplateSchema.index({ template_name: 1, language: 1 });
metaTemplateSchema.index({ category: 1, status: 1 });
metaTemplateSchema.index({ whatsapp_business_account_id: 1 });
metaTemplateSchema.index({ createdAt: -1 });

// Virtual for template age
metaTemplateSchema.virtual('age_in_days').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Virtual for status display
metaTemplateSchema.virtual('status_display').get(function() {
  const statusMap = {
    'PENDING': 'Pending Approval',
    'APPROVED': 'Approved',
    'REJECTED': 'Rejected',
    'PAUSED': 'Paused',
    'DISABLED': 'Disabled'
  };
  return statusMap[this.status] || this.status;
});

// Pre-save middleware to update sync status
metaTemplateSchema.pre('save', function(next) {
  if (this.isModified('status') || this.isModified('components')) {
    this.last_sync_at = new Date();
  }
  next();
});

// Static method to find templates by user
metaTemplateSchema.statics.findByUser = function(userId, options = {}) {
  const query = { created_by: userId, is_active: true };
  
  if (options.status) {
    query.status = options.status;
  }
  
  if (options.category) {
    query.category = options.category;
  }
  
  return this.find(query)
    .populate('created_by', 'username firstName lastName role')
    .populate('whatsapp_official_category_id', 'name description')
    .populate('campaign_category_id', 'name creditCost')
    .sort({ createdAt: -1 });
};

// Static method to find templates by status
metaTemplateSchema.statics.findByStatus = function(status, options = {}) {
  const query = { status, is_active: true };
  
  if (options.userId) {
    query.created_by = options.userId;
  }
  
  return this.find(query)
    .populate('created_by', 'username firstName lastName role')
    .sort({ createdAt: -1 });
};

// Instance method to mark as deleted
metaTemplateSchema.methods.softDelete = function(deletedBy) {
  this.is_active = false;
  this.deleted_at = new Date();
  this.deleted_by = deletedBy;
  return this.save();
};

// Instance method to update status from Meta API
metaTemplateSchema.methods.updateFromMeta = function(metaData) {
  this.status = metaData.status;
  this.last_sync_at = new Date();
  this.sync_status = 'synced';
  this.meta_api_response = metaData;
  return this.save();
};

const MetaTemplate = mongoose.model('MetaTemplate', metaTemplateSchema);

module.exports = MetaTemplate;
