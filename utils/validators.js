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
    // Basic phone number validation
    // Allows formats like: +1234567890, 1234567890, (123) 456-7890
    const phoneRegex = /^(\+\d{1,3}[- ]?)?\(?\d{3}\)?[- ]?\d{3}[- ]?\d{4}$/;
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