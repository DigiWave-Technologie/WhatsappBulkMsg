const express = require('express');
const router = express.Router();
const templateController = require('../controllers/templateController');
const { authenticateToken } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permissions');
const multer = require('multer');
const path = require('path');

// Protect all template routes
router.use(authenticateToken);

// All routes below require authentication
router.get('/', templateController.getUserTemplates);
router.get('/pending', checkPermission('approve_templates'), templateController.getPendingTemplates);
router.get('/:templateId', templateController.getTemplateById);

// Multer storage for template media
const templateMediaStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../uploads/template-media'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter for images, video, pdf
const templateMediaFileFilter = (req, file, cb) => {
    const allowedTypes = [
        'image/jpeg', 'image/png', 'image/jpg',
        'video/mp4', 'video/mpeg', 'application/pdf'
    ];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only images, video, and PDF are allowed!'), false);
    }
};

const uploadTemplateMedia = multer({
    storage: templateMediaStorage,
    fileFilter: templateMediaFileFilter,
    limits: { fileSize: 15 * 1024 * 1024 }
});

router.post('/', uploadTemplateMedia.fields([
    { name: 'images', maxCount: 4 },
    { name: 'video', maxCount: 1 },
    { name: 'pdf', maxCount: 1 }
]), templateController.createTemplate);

router.put('/:templateId', uploadTemplateMedia.fields([
    { name: 'images', maxCount: 4 },
    { name: 'video', maxCount: 1 },
    { name: 'pdf', maxCount: 1 }
]), templateController.updateTemplate);

router.delete('/:templateId', templateController.deleteTemplate);
router.post('/:templateId/approve', checkPermission('approve_templates'), templateController.approveTemplate);
router.post('/:templateId/reject', checkPermission('approve_templates'), templateController.rejectTemplate);

module.exports = router; 