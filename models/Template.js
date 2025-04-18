const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    content: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true,
        enum: ['marketing', 'utility', 'authentication']
    },
    language: {
        type: String,
        default: 'en'
    },
    status: {
        type: String,
        default: 'pending',
        enum: ['pending', 'approved', 'rejected']
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    metadata: {
        approvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        approvedAt: Date,
        rejectionReason: String
    }
}, {
    timestamps: true
});

// Method to extract variables from template content
templateSchema.methods.extractVariables = function() {
    const variableRegex = /{{([^}]+)}}/g;
    const matches = this.content.match(variableRegex) || [];
    this.variables = matches.map(match => match.slice(2, -2));
};

// Indexes for better query performance
templateSchema.index({ userId: 1, status: 1 });
templateSchema.index({ category: 1, language: 1 });

// Pre-save middleware to validate template content
templateSchema.pre('save', function(next) {
    // Validate that all required variables are present in the content
    const requiredVariables = this.variables.filter(v => v.required);
    for (const variable of requiredVariables) {
        const regex = new RegExp(`{{${variable.name}}}`, 'g');
        if (!regex.test(this.content)) {
            next(new Error(`Required variable ${variable.name} is not present in the template content`));
            return;
        }
    }
    next();
});

// Method to validate template variables against provided values
templateSchema.methods.validateVariables = function(values) {
    const errors = [];
    for (const variable of this.variables) {
        const value = values[variable.name];
        
        // Check required variables
        if (variable.required && !value) {
            errors.push(`Variable ${variable.name} is required`);
            continue;
        }

        // Skip validation if value is not provided
        if (!value) continue;

        // Validate type
        switch (variable.type) {
            case 'number':
                if (isNaN(value)) {
                    errors.push(`Variable ${variable.name} must be a number`);
                }
                break;
            case 'date':
                if (isNaN(Date.parse(value))) {
                    errors.push(`Variable ${variable.name} must be a valid date`);
                }
                break;
            case 'currency':
                if (isNaN(value) || value < 0) {
                    errors.push(`Variable ${variable.name} must be a valid currency amount`);
                }
                break;
        }
    }
    return errors;
};

// Method to replace variables in template content
templateSchema.methods.replaceVariables = function(values) {
    let content = this.content;
    for (const [key, value] of Object.entries(values)) {
        const regex = new RegExp(`{{${key}}}`, 'g');
        content = content.replace(regex, value);
    }
    return content;
};

// Export the schema and model
module.exports = mongoose.models.Template || mongoose.model('Template', templateSchema);
