const { body, validationResult } = require('express-validator');
const { ApiError } = require('./errorHandler');
const { validatePhoneNumber } = require('../utils/validators');

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => err.msg);
    return next(new ApiError(400, errorMessages.join(', ')));
  }
  next();
};

// Login validation
const loginValidation = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required'),
  body('password')
    .trim()
    .notEmpty()
    .withMessage('Password is required'),
  validate
];

// Registration validation (for creating new users)
const registrationValidation = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required'),
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('First name must be at least 2 characters long'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Last name must be at least 2 characters long'),
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email'),
  body('mobileNumber')
    .optional()
    .trim()
    .matches(/^[0-9]{10}$/)
    .withMessage('Please provide a valid 10-digit mobile number'),
  body('password')
    .trim()
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('role')
    .trim()
    .notEmpty()
    .withMessage('Role is required')
    .isIn(['super_admin', 'admin', 'reseller', 'user'])
    .withMessage('Invalid role'),
  validate
];

// Password change validation
const passwordChangeValidation = [
  body('currentPassword')
    .trim()
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .trim()
    .notEmpty()
    .withMessage('New password is required')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error('New password must be different from current password');
      }
      return true;
    }),
  validate
];

// User update validation
const userUpdateValidation = [
  body('firstName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('First name cannot be empty')
    .isLength({ min: 2 })
    .withMessage('First name must be at least 2 characters long'),
  body('lastName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Last name cannot be empty')
    .isLength({ min: 2 })
    .withMessage('Last name must be at least 2 characters long'),
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email'),
  body('mobileNumber')
    .optional()
    .trim()
    .matches(/^[0-9]{10}$/)
    .withMessage('Please provide a valid 10-digit mobile number'),
  body('role')
    .optional()
    .trim()
    .isIn(['super_admin', 'admin', 'reseller', 'user'])
    .withMessage('Invalid role'),
  validate
];

const validateCampaign = async (req, res, next) => {
  console.log('Validating campaign data:', req.body);
  try {
    const { recipients, schedule, type } = req.body;

    // Validate recipients
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      throw new Error('Recipients are required and must be an array');
    }

    // Validate phone numbers (support both string and object)
    recipients.forEach(recipient => {
      let phone = null;
      if (typeof recipient === 'string') {
        phone = recipient;
      } else if (recipient && typeof recipient.phoneNumber === 'string') {
        phone = recipient.phoneNumber;
      }
      if (!phone) {
        throw new Error('Phone number is required for each recipient');
      }
      validatePhoneNumber(phone);
    });

    // Validate schedule
    if (!schedule || !schedule.startAt) {
      throw new Error('Schedule start time is required');
    }

    // Validate recurring campaign data
    if (type === 'recurring') {
      if (!req.body.recurringSchedule || !req.body.recurringSchedule.frequency) {
        throw new Error('Recurring schedule frequency is required for recurring campaigns');
      }
    }

    next();
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  loginValidation,
  registrationValidation,
  passwordChangeValidation,
  userUpdateValidation,
  validateCampaign
}; 