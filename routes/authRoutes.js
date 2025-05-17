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
const { adminMiddleware } = require('../middleware/adminMiddleware');

// Configure multer for image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../uploads/profile-pictures'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter to only allow image files
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Not an image! Please upload only images.'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Public routes
router.post('/login', validateLogin, authController.userLogin);

// Protected routes
router.post('/logout', authMiddleware, authController.logout);
router.post('/change-password', authMiddleware, passwordChangeValidation, authController.changePassword);
router.post('/force-password-reset/:userId', authMiddleware, authController.forcePasswordReset);
router.post('/createUser', authMiddleware, upload.single('profilePicture'), registrationValidation, authController.createUser);
router.put('/update-user/:id', authMiddleware, validateUpdateUser, authController.updateUser);
router.delete('/delete-user/:id', authMiddleware, authController.deleteUser);
router.get('/users', authMiddleware, authController.getAllUsers);
router.post('/upload-logo', authMiddleware, upload.single('logo'), authController.uploadUserLogo);
router.get('/security-logs', authMiddleware, authController.getSecurityLogs);
router.get('/security-audit/:userId', authMiddleware, authController.getSecurityAudit);
router.get('/active-sessions', authMiddleware, authController.getActiveSessions);
router.get('/active-sessions/:userId', authMiddleware, authController.getActiveSessions);
router.post('/unlock-account/:userId', authMiddleware, authController.unlockAccount);
router.post('/lock-account/:userId', authMiddleware, authController.lockAccount);
router.post('/generate-api-key', authMiddleware, authController.generateApiKey);
router.post('/revoke-api-key', authMiddleware, authController.revokeApiKey);

// Profile picture routes
router.put('/profile-picture', authMiddleware, upload.single('profilePicture'), authController.updateProfilePicture);

// Admin routes
router.post('/admin/change-user-password/:userId', authMiddleware, adminMiddleware, passwordChangeValidation, authController.adminChangeUserPassword);
router.get('/admin/user-credentials', authMiddleware, adminMiddleware, authController.getAllUserCredentials);

module.exports = router;
