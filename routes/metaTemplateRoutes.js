const express = require('express');
const router = express.Router();
const metaTemplateController = require('../controllers/metaTemplateController');
const { authenticateToken } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticateToken);

/**
 * @route   POST /api/meta-templates
 * @desc    Create a new WhatsApp template directly in Meta API
 * @access  Private
 * @body    {
 *   template_name: string,
 *   language: string,
 *   category?: string,
 *   body: string,
 *   footer_text?: string,
 *   header?: object,
 *   action_buttons?: array,
 *   whatsapp_business_account_id?: string
 * }
 */
router.post('/', metaTemplateController.createTemplate);

/**
 * @route   GET /api/meta-templates
 * @desc    Get all WhatsApp templates from Meta API
 * @access  Private
 * @query   {
 *   limit?: number,
 *   after?: string,
 *   search?: string
 * }
 */
router.get('/', metaTemplateController.getTemplates);

/**
 * @route   GET /api/meta-templates/all/details
 * @desc    Get ALL WhatsApp templates with full details from Meta API
 * @access  Private
 * @note    Fetches all templates across all pages with complete information
 */
router.get('/all/details', metaTemplateController.getAllTemplatesWithDetails);

/**
 * @route   GET /api/meta-templates/local
 * @desc    Get templates from local database with pagination and filtering
 * @access  Private
 * @query   {
 *   status?: string,
 *   category?: string,
 *   limit?: number,
 *   page?: number,
 *   search?: string,
 *   include_deleted?: boolean
 * }
 */
router.get('/local', metaTemplateController.getLocalTemplates);

/**
 * @route   GET /api/meta-templates/:id
 * @desc    Get WhatsApp template by ID from Meta API
 * @access  Private
 */
router.get('/:id', metaTemplateController.getTemplate);

/**
 * @route   PUT /api/meta-templates/:id
 * @desc    Update WhatsApp template (delete and recreate in Meta API)
 * @access  Private
 */
router.put('/:id', metaTemplateController.updateTemplate);

/**
 * @route   DELETE /api/meta-templates/:id
 * @desc    Delete WhatsApp template from Meta API
 * @access  Private
 */
router.delete('/:id', metaTemplateController.deleteTemplate);

/**
 * @route   POST /api/meta-templates/bulk-delete
 * @desc    Delete multiple WhatsApp templates from Meta API (no limit)
 * @access  Private
 * @body    {
 *   templateIds: string[] (unlimited - processes sequentially)
 * }
 */
router.post('/bulk-delete', metaTemplateController.deleteMultipleTemplates);

/**
 * @route   GET /api/meta-templates/:id/analytics
 * @desc    Get template analytics and insights
 * @access  Private
 */
router.get('/:id/analytics', metaTemplateController.getTemplateAnalytics);

/**
 * @route   POST /api/meta-templates/:id/sync
 * @desc    Sync template status from Meta API to local database
 * @access  Private
 */
router.post('/:id/sync', metaTemplateController.syncTemplateStatus);

/**
 * @route   GET /api/meta-templates/categories/whatsapp
 * @desc    Get WhatsApp Official Categories for template creation
 * @access  Private
 */
router.get('/categories/whatsapp', metaTemplateController.getWhatsAppCategories);

/**
 * @route   GET /api/meta-templates/categories/campaign
 * @desc    Get Campaign Categories for credit management
 * @access  Private
 */
router.get('/categories/campaign', metaTemplateController.getCampaignCategories);

/**
 * @route   GET /api/meta-templates/user/credits
 * @desc    Get user's credit balance for template creation
 * @access  Private
 */
router.get('/user/credits', metaTemplateController.getUserCredits);

module.exports = router;
