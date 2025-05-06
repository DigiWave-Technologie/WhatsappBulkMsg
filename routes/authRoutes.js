const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const multer = require('multer');
const path = require('path');
const { authMiddleware, checkPasswordChangeRequired } = require('../middleware/authMiddleware');
const { 
  loginValidation, 
  registrationValidation, 
  passwordChangeValidation, 
  userUpdateValidation 
} = require('../middleware/validationMiddleware');
const { validateLogin, validateCreateUser, validateUpdateUser } = require('../middleware/validateRequest');

// Configure multer for image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../uploads/logo'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

// Public routes
router.post('/login', validateLogin, authController.userLogin);

// Protected routes
router.post('/logout', authMiddleware, authController.logout);
router.post('/change-password', authMiddleware, passwordChangeValidation, authController.changePassword);
router.post('/force-password-reset/:userId', authMiddleware, checkPasswordChangeRequired, authController.forcePasswordReset);
router.post('/createUser', authMiddleware, checkPasswordChangeRequired, validateCreateUser, authController.createUser);
router.put('/update-user/:id', authMiddleware, checkPasswordChangeRequired, validateUpdateUser, authController.updateUser);
router.delete('/delete-user/:id', authMiddleware, checkPasswordChangeRequired, authController.deleteUser);
router.get('/users', authMiddleware, checkPasswordChangeRequired, authController.getAllUsers);
router.post('/upload-logo', authMiddleware, checkPasswordChangeRequired, upload.single('logo'), authController.uploadUserLogo);
router.get('/security-logs', authMiddleware, checkPasswordChangeRequired, authController.getSecurityLogs);
router.get('/security-audit/:userId', authMiddleware, checkPasswordChangeRequired, authController.getSecurityAudit);
router.get('/active-sessions', authMiddleware, checkPasswordChangeRequired, authController.getActiveSessions);
router.get('/active-sessions/:userId', authMiddleware, checkPasswordChangeRequired, authController.getActiveSessions);
router.post('/unlock-account/:userId', authMiddleware, checkPasswordChangeRequired, authController.unlockAccount);
router.post('/lock-account/:userId', authMiddleware, checkPasswordChangeRequired, authController.lockAccount);
router.post('/generate-api-key', authMiddleware, checkPasswordChangeRequired, authController.generateApiKey);
router.post('/revoke-api-key', authMiddleware, checkPasswordChangeRequired, authController.revokeApiKey);

module.exports = router;
