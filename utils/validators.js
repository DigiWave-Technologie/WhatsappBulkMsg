const mongoose = require('mongoose');

/**
 * Validates if a string is a valid MongoDB ObjectId
 * @param {string} id - The ID to validate
 * @returns {boolean} - True if valid ObjectId, false otherwise
 */
const validateObjectId = (id) => {
    return mongoose.Types.ObjectId.isValid(id);
};

/**
 * Validates if a string is a valid phone number
 * @param {string} phoneNumber - The phone number to validate
 * @returns {boolean} - True if valid phone number, false otherwise
 */
const validatePhoneNumber = (phoneNumber) => {
    // Basic phone number validation - can be enhanced based on your needs
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phoneNumber);
};

/**
 * Validates if a string is a valid email address
 * @param {string} email - The email to validate
 * @returns {boolean} - True if valid email, false otherwise
 */
const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

module.exports = {
    validateObjectId,
    validatePhoneNumber,
    validateEmail
}; 