const { body, validationResult } = require('express-validator');

// Validation middleware to check for validation errors
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false, 
      errors: errors.array() 
    });
  }
  next();
};

// Message validation rules
const messageValidation = [
  body('to')
    .notEmpty()
    .withMessage('Recipient number is required')
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Invalid phone number format'),
  body('message')
    .notEmpty()
    .withMessage('Message content is required')
    .isString()
    .withMessage('Message must be a string'),
  body('media')
    .optional()
    .isObject()
    .withMessage('Media must be an object'),
  validate
];

// Template validation rules
const templateValidation = [
  body('to')
    .notEmpty()
    .withMessage('Recipient number is required')
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Invalid phone number format'),
  body('templateName')
    .notEmpty()
    .withMessage('Template name is required')
    .isString()
    .withMessage('Template name must be a string'),
  body('languageCode')
    .optional()
    .isString()
    .withMessage('Language code must be a string'),
  body('components')
    .optional()
    .isArray()
    .withMessage('Components must be an array'),
  validate
];

// Group validation rules
const groupValidation = [
  body('name')
    .notEmpty()
    .withMessage('Group name is required')
    .isString()
    .withMessage('Group name must be a string'),
  body('contacts')
    .isArray()
    .withMessage('Contacts must be an array')
    .notEmpty()
    .withMessage('At least one contact is required'),
  body('contacts.*')
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Invalid phone number format in contacts'),
  validate
];

// Campaign validation rules
const campaignValidation = [
  body('title')
    .notEmpty()
    .withMessage('Campaign title is required')
    .isString()
    .withMessage('Campaign title must be a string'),
  body('message')
    .notEmpty()
    .withMessage('Campaign message is required')
    .isString()
    .withMessage('Campaign message must be a string'),
  body('recipients')
    .isArray()
    .withMessage('Recipients must be an array')
    .notEmpty()
    .withMessage('At least one recipient is required'),
  body('recipients.*')
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Invalid phone number format in recipients'),
  body('media')
    .optional()
    .isObject()
    .withMessage('Media must be an object'),
  validate
];

module.exports = {
  validate,
  messageValidation,
  templateValidation,
  groupValidation,
  campaignValidation
}; 