const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { ApiError } = require('../middleware/errorHandler');

// Generate a random string of specified length
const generateRandomString = (length = 32) => {
    return crypto.randomBytes(length).toString('hex');
};

// Generate API key
const generateApiKey = () => {
    const prefix = 'wa';
    const randomBytes = crypto.randomBytes(16).toString('hex');
    const timestamp = Date.now().toString(36);
    return `${prefix}_${randomBytes}${timestamp}`;
};

// Hash API key for storage
const hashApiKey = (apiKey) => {
    return crypto.createHash('sha256').update(apiKey).digest('hex');
};

// Generate JWT token
const generateToken = (userId, role) => {
    return jwt.sign(
        { _id: userId, role },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
    );
};

// Validate phone number format
const validatePhoneNumber = (phoneNumber) => {
    // Remove any non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Check if the number is valid (basic validation)
    if (cleaned.length < 10 || cleaned.length > 15) {
        throw new ApiError(400, 'Invalid phone number format');
    }
    
    return cleaned;
};

// Format phone number to international format
const formatPhoneNumber = (phoneNumber) => {
    const cleaned = validatePhoneNumber(phoneNumber);
    
    // Add country code if not present
    if (!cleaned.startsWith('+')) {
        return `+${cleaned}`;
    }
    
    return cleaned;
};

// Validate email format
const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        throw new ApiError(400, 'Invalid email format');
    }
    return email;
};

// Format date to ISO string
const formatDate = (date) => {
    return new Date(date).toISOString();
};

// Calculate message credits based on content length and media
const calculateMessageCredits = (content, media = []) => {
    let credits = 1; // Base credit for text message
    
    // Add credits for media
    if (media && media.length > 0) {
        credits += media.length;
    }
    
    // Add credits for long messages (every 1000 characters)
    if (content && content.length > 1000) {
        credits += Math.ceil(content.length / 1000);
    }
    
    return credits;
};

// Validate file type
const validateFileType = (file, allowedTypes) => {
    const fileType = file.mimetype.split('/')[1];
    if (!allowedTypes.includes(fileType)) {
        throw new ApiError(400, `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`);
    }
    return true;
};

// Validate file size
const validateFileSize = (file, maxSize) => {
    const fileSize = file.size / 1024 / 1024; // Convert to MB
    if (fileSize > maxSize) {
        throw new ApiError(400, `File size should be less than ${maxSize}MB`);
    }
    return true;
};

// Generate a unique filename
const generateUniqueFilename = (originalname) => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const extension = originalname.split('.').pop();
    return `${timestamp}-${random}.${extension}`;
};

// Parse template variables from content
const parseTemplateVariables = (content) => {
    const regex = /{{([^}]+)}}/g;
    const matches = content.match(regex) || [];
    return matches.map(match => match.slice(2, -2));
};

// Replace template variables with values
const replaceTemplateVariables = (content, values) => {
    let result = content;
    for (const [key, value] of Object.entries(values)) {
        const regex = new RegExp(`{{${key}}}`, 'g');
        result = result.replace(regex, value);
    }
    return result;
};

module.exports = {
    generateRandomString,
    generateApiKey,
    hashApiKey,
    generateToken,
    validatePhoneNumber,
    formatPhoneNumber,
    validateEmail,
    formatDate,
    calculateMessageCredits,
    validateFileType,
    validateFileSize,
    generateUniqueFilename,
    parseTemplateVariables,
    replaceTemplateVariables
}; 