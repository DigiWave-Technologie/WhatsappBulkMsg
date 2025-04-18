const express = require('express');
const router = express.Router();
const msgTemplateController = require('../controllers/msgTemplateController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Apply auth middleware to all template routes
router.post('/', authMiddleware, msgTemplateController.addTemplate);
router.get('/', authMiddleware, msgTemplateController.getAllTemplates);
router.get('/:id', authMiddleware, msgTemplateController.getTemplateById);
router.put('/:id', authMiddleware, msgTemplateController.updateTemplate);
router.delete('/:id', authMiddleware, msgTemplateController.deleteTemplate);

module.exports = router;
