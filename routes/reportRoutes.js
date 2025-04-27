const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// System-wide statistics (Super Admin only)
router.get('/system',
  authenticateToken,
  authorizeRole(['superadmin']),
  reportController.getSystemStats
);

// Admin-level statistics
router.get('/admin',
  authenticateToken,
  authorizeRole(['admin']),
  reportController.getAdminStats
);

// Reseller-level statistics
router.get('/reseller',
  authenticateToken,
  authorizeRole(['reseller']),
  reportController.getResellerStats
);

// User-level statistics
router.get('/user',
  authenticateToken,
  authorizeRole(['user']),
  reportController.getUserStats
);

// Campaign report
router.get('/campaign/:campaignId',
  authenticateToken,
  reportController.getCampaignReport
);

// Export report to CSV
router.get('/export',
  authenticateToken,
  reportController.exportReport
);

module.exports = router; 