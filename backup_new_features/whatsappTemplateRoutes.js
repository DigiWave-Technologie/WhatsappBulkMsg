const express = require('express');
const router = express.Router();
const whatsappTemplateController = require('../controllers/whatsappTemplateController');
const { authenticateToken } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticateToken);

/**
 * @route   POST /api/whatsapp-templates
 * @desc    Create a new WhatsApp template with Meta API sync
 * @access  Private
 * @body    {
 *   template_name: string,
 *   category: ObjectId,
 *   language: string,
 *   template_type: string,
 *   header?: object,
 *   body: string,
 *   footer_text?: string,
 *   action_buttons?: array,
 *   whatsapp_business_account_id?: string,
 *   auto_sync_to_meta?: boolean,
 *   meta_category?: string
 * }
 */
router.post('/', whatsappTemplateController.createTemplate);

/**
 * @route   GET /api/whatsapp-templates
 * @desc    Get all templates for authenticated user
 * @access  Private
 * @query   {
 *   page?: number,
 *   limit?: number,
 *   status?: string,
 *   search?: string
 * }
 */
router.get('/', whatsappTemplateController.getTemplates);

/**
 * @route   GET /api/whatsapp-templates/:id
 * @desc    Get template by ID
 * @access  Private
 */
router.get('/:id', whatsappTemplateController.getTemplate);

/**
 * @route   PUT /api/whatsapp-templates/:id
 * @desc    Update template
 * @access  Private
 */
router.put('/:id', whatsappTemplateController.updateTemplate);

/**
 * @route   DELETE /api/whatsapp-templates/:id
 * @desc    Delete template
 * @access  Private
 */
router.delete('/:id', whatsappTemplateController.deleteTemplate);

/**
 * @route   POST /api/whatsapp-templates/:id/sync
 * @desc    Sync template to Meta API
 * @access  Private
 */
router.post('/:id/sync', whatsappTemplateController.syncTemplate);

/**
 * @route   GET /api/whatsapp-templates/:id/status
 * @desc    Get template status from Meta API
 * @access  Private
 */
router.get('/:id/status', whatsappTemplateController.getTemplateStatus);

module.exports = router;
