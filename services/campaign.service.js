const Campaign = require('../models/Campaign');

const addCampaign = async (campaignData) => {
    try {
        const newCampaign = new Campaign(campaignData);
        const savedCampaign = await newCampaign.save();
        return savedCampaign;
    } catch (error) {
        console.error('Error adding campaign:', error);
        throw error;
    }
};

module.exports = {
    addCampaign
}; // Export the function as a module