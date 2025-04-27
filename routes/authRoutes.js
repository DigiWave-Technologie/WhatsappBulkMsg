const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const multer = require('multer');
const path = require('path');
const { authMiddleware } = require('../middleware/authMiddleware');
const { 
  loginValidation, 
  registrationValidation, 
  passwordChangeValidation, 
  userUpdateValidation 
} = require('../middleware/validationMiddleware');
const { validateLogin, validateCreateUser, validateUpdateUser } = require('../middleware/validateRequest');
const { authenticateToken } = require('../middleware/auth');

// Configure multer for image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../uploads/logo')); // Ensure 'uploads/logo' exists
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname)); // Generate unique filename
    }
});

const upload = multer({ storage });

// Public routes
router.post('/login', validateLogin, authController.userLogin);

// Protected routes
router.post('/createUser', authenticateToken, validateCreateUser, authController.createUser);
router.put('/updateUser/:id', authenticateToken, validateUpdateUser, authController.updateUser);
router.post('/changePassword', authMiddleware, passwordChangeValidation, authController.changePassword);
router.get('/users', authMiddleware, authController.getAllUsers);
router.post('/logout', authMiddleware, authController.logout);

// API Key routes
router.post('/generateApiKey', authenticateToken, authController.generateApiKey);
router.post('/revokeApiKey', authenticateToken, authController.revokeApiKey);

module.exports = router;
