const express = require('express');
const router = express.Router();
const campaignCreditController = require('../controllers/campaignCreditController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { isSuperAdmin, isAdmin, isReseller } = require('../middleware/roleMiddleware');

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Get user's campaign credits
router.get('/user', campaignCreditController.getUserCampaignCredits);

// Transfer credits (only for super_admin, admin, and reseller roles)
router.post('/transfer', 
  (req, res, next) => {
    if (req.user.role === 'super_admin' || req.user.role === 'admin' || req.user.role === 'reseller') {
      next();
    } else {
      res.status(403).json({
        success: false,
        message: 'Access denied. Only super admins, admins, and resellers can transfer credits.'
      });
    }
  },
  campaignCreditController.transferCredits
);

// Debit credits for campaign usage
router.post('/debit', campaignCreditController.debitCredits);

// Get credit transactions for a campaign
router.get('/transactions/:campaignId', campaignCreditController.getCampaignCreditTransactions);

// Process refund for failed messages
router.post('/refund', campaignCreditController.processRefund);

// Update refund settings (only for super_admin and admin roles)
router.put('/refund-settings',
  (req, res, next) => {
    if (req.user.role === 'super_admin' || req.user.role === 'admin') {
      next();
    } else {
      res.status(403).json({
        success: false,
        message: 'Access denied. Only super admins and admins can update refund settings.'
      });
    }
  },
  campaignCreditController.updateRefundSettings
);

// Get refund statistics for a campaign
router.get('/refund-stats/:campaignId', campaignCreditController.getRefundStats);

module.exports = router; 