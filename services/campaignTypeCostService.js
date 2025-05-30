const CampaignTypeCost = require('../models/CampaignTypeCost');

class CampaignTypeCostService {
    /**
     * Set or update cost for a campaign type
     */
    async setCampaignTypeCost(type, cost, description, metadata = {}) {
        try {
            const costData = await CampaignTypeCost.findOneAndUpdate(
                { type },
                {
                    cost,
                    description,
                    metadata,
                    isActive: true
                },
                { upsert: true, new: true }
            );
            return costData;
        } catch (error) {
            throw new Error(`Failed to set campaign type cost: ${error.message}`);
        }
    }

    /**
     * Get cost for a specific campaign type
     */
    async getCampaignTypeCost(type) {
        try {
            const costData = await CampaignTypeCost.findOne({ type, isActive: true });
            if (!costData) {
                throw new Error(`No cost configuration found for campaign type: ${type}`);
            }
            return costData;
        } catch (error) {
            throw new Error(`Failed to get campaign type cost: ${error.message}`);
        }
    }

    /**
     * Get all campaign type costs
     */
    async getAllCampaignTypeCosts() {
        try {
            return await CampaignTypeCost.find({ isActive: true });
        } catch (error) {
            throw new Error(`Failed to get campaign type costs: ${error.message}`);
        }
    }

    /**
     * Deactivate a campaign type cost
     */
    async deactivateCampaignTypeCost(type) {
        try {
            const costData = await CampaignTypeCost.findOneAndUpdate(
                { type },
                { isActive: false },
                { new: true }
            );
            if (!costData) {
                throw new Error(`No cost configuration found for campaign type: ${type}`);
            }
            return costData;
        } catch (error) {
            throw new Error(`Failed to deactivate campaign type cost: ${error.message}`);
        }
    }

    /**
     * Calculate total cost for a campaign based on its type and number of recipients
     */
    async calculateCampaignCost(type, recipientCount) {
        try {
            const costData = await this.getCampaignTypeCost(type);
            return costData.cost * recipientCount;
        } catch (error) {
            throw new Error(`Failed to calculate campaign cost: ${error.message}`);
        }
    }
}

module.exports = new CampaignTypeCostService(); 