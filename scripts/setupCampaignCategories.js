const mongoose = require('mongoose');
const Category = require('../models/Category');
require('dotenv').config();

const campaignCategories = [
    {
        name: 'Virtual Campaigns',
        description: 'Credits for virtual campaign types',
        creditCost: 1,
        campaignTypes: [
            { type: 'VIRTUAL_QUICK', creditMultiplier: 1.0 },
            { type: 'VIRTUAL_BUTTON', creditMultiplier: 1.5 },
            { type: 'VIRTUAL_DP', creditMultiplier: 2.0 }
        ],
        mediaCreditCost: 1,
        interactiveCreditCost: 1
    },
    {
        name: 'Personal Campaigns',
        description: 'Credits for personal campaign types',
        creditCost: 1,
        campaignTypes: [
            { type: 'PERSONAL_QUICK', creditMultiplier: 1.2 },
            { type: 'PERSONAL_BUTTON', creditMultiplier: 1.7 },
            { type: 'PERSONAL_POLL', creditMultiplier: 2.0 }
        ],
        mediaCreditCost: 1,
        interactiveCreditCost: 1
    },
    {
        name: 'International Personal Campaigns',
        description: 'Credits for international personal campaign types',
        creditCost: 1,
        campaignTypes: [
            { type: 'INTERNATIONAL_PERSONAL_QUICK', creditMultiplier: 1.5 },
            { type: 'INTERNATIONAL_PERSONAL_BUTTON', creditMultiplier: 2.0 },
            { type: 'INTERNATIONAL_PERSONAL_POLL', creditMultiplier: 2.5 }
        ],
        mediaCreditCost: 1,
        interactiveCreditCost: 1
    },
    {
        name: 'International Virtual Campaigns',
        description: 'Credits for international virtual campaign types',
        creditCost: 1,
        campaignTypes: [
            { type: 'INTERNATIONAL_VIRTUAL_QUICK', creditMultiplier: 1.3 },
            { type: 'INTERNATIONAL_VIRTUAL_BUTTON', creditMultiplier: 1.8 }
        ],
        mediaCreditCost: 1,
        interactiveCreditCost: 1
    }
];

async function setupCampaignCategories() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Clear existing categories
        await Category.deleteMany({});
        console.log('Cleared existing categories');

        // Create new categories
        const createdCategories = await Category.insertMany(campaignCategories);
        console.log('Created new categories:', createdCategories.map(c => c.name));

        console.log('Campaign categories setup completed successfully');
    } catch (error) {
        console.error('Error setting up campaign categories:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

setupCampaignCategories(); 