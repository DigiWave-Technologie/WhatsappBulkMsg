const express = require('express');
const router = express.Router();
const campaignTypeCostController = require('../controllers/campaignTypeCostController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permissions');

// Set or update campaign type cost (Admin only)
router.post('/set', 
    authenticateToken, 
    authorizeRole(['admin', 'super_admin']),
    checkPermission('manage_pricing_plans'),
    campaignTypeCostController.setCampaignTypeCost
);

// Get cost for a specific campaign type
router.get('/:type', 
    authenticateToken, 
    campaignTypeCostController.getCampaignTypeCost
);

// Get all campaign type costs
router.get('/', 
    authenticateToken, 
    campaignTypeCostController.getAllCampaignTypeCosts
);

// Deactivate a campaign type cost (Admin only)
router.delete('/:type', 
    authenticateToken, 
    authorizeRole(['admin', 'super_admin']),
    checkPermission('manage_pricing_plans'),
    campaignTypeCostController.deactivateCampaignTypeCost
);

// Calculate campaign cost
router.post('/calculate', 
    authenticateToken, 
    campaignTypeCostController.calculateCampaignCost
);

module.exports = router; 