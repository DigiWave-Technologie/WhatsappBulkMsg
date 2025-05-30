const campaignTypeCostService = require('../services/campaignTypeCostService');
const { asyncHandler } = require('../middleware/errorHandler');

// Set or update campaign type cost
const setCampaignTypeCost = asyncHandler(async (req, res) => {
    const { type, cost, description, metadata } = req.body;
    
    const result = await campaignTypeCostService.setCampaignTypeCost(
        type,
        cost,
        description,
        metadata
    );
    
    res.status(200).json({
        success: true,
        message: 'Campaign type cost set successfully',
        data: result
    });
});

// Get cost for a specific campaign type
const getCampaignTypeCost = asyncHandler(async (req, res) => {
    const { type } = req.params;
    
    const result = await campaignTypeCostService.getCampaignTypeCost(type);
    
    res.status(200).json({
        success: true,
        data: result
    });
});

// Get all campaign type costs
const getAllCampaignTypeCosts = asyncHandler(async (req, res) => {
    const result = await campaignTypeCostService.getAllCampaignTypeCosts();
    
    res.status(200).json({
        success: true,
        data: result
    });
});

// Deactivate a campaign type cost
const deactivateCampaignTypeCost = asyncHandler(async (req, res) => {
    const { type } = req.params;
    
    const result = await campaignTypeCostService.deactivateCampaignTypeCost(type);
    
    res.status(200).json({
        success: true,
        message: 'Campaign type cost deactivated successfully',
        data: result
    });
});

// Calculate campaign cost
const calculateCampaignCost = asyncHandler(async (req, res) => {
    const { type, recipientCount } = req.body;
    
    const result = await campaignTypeCostService.calculateCampaignCost(type, recipientCount);
    
    res.status(200).json({
        success: true,
        data: {
            type,
            recipientCount,
            totalCost: result
        }
    });
});

module.exports = {
    setCampaignTypeCost,
    getCampaignTypeCost,
    getAllCampaignTypeCosts,
    deactivateCampaignTypeCost,
    calculateCampaignCost
}; 