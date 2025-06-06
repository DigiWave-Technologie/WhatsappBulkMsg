require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('../models/Category');
const Campaign = require('../models/Campaign');
const Credit = require('../models/Credit');
const User = require('../models/User');

async function testCreditSystem() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/whatsapp_bulk_campaign');
        console.log('Connected to MongoDB');

        // Create test user
        const user = await User.create({
            username: 'testuser',
            email: 'test@example.com',
            password: 'password123',
            role: 'user',
            createdBy: 'system',
            firstName: 'Test',
            lastName: 'User',
            mobileNumber: '+1234567890',
            permissions: {
                virtual: true,
                personal: true,
                internationalPersonal: true,
                internationalVirtual: true
            }
        });
        console.log('Created test user:', user._id);

        // Create Virtual Campaigns category
        const virtualCategory = await Category.create({
            name: "Virtual Campaigns",
            description: "For virtual number campaigns",
            creditCost: 1,
            campaignTypes: [
                {
                    type: "VIRTUAL_QUICK",
                    creditMultiplier: 1.0
                },
                {
                    type: "VIRTUAL_BUTTON",
                    creditMultiplier: 1.5
                }
            ],
            mediaCreditCost: 2,
            interactiveCreditCost: 3,
            isActive: true
        });
        console.log('Created Virtual Campaigns category:', virtualCategory._id);

        // Create International Campaigns category
        const internationalCategory = await Category.create({
            name: "International Campaigns",
            description: "For international campaigns",
            creditCost: 2,
            campaignTypes: [
                {
                    type: "INTERNATIONAL_VIRTUAL_QUICK",
                    creditMultiplier: 1.0
                },
                {
                    type: "INTERNATIONAL_VIRTUAL_BUTTON",
                    creditMultiplier: 1.5
                }
            ],
            mediaCreditCost: 3,
            interactiveCreditCost: 4,
            isActive: true
        });
        console.log('Created International Campaigns category:', internationalCategory._id);

        // Add credits to categories
        const virtualCredits = await Credit.create({
            userId: user._id,
            categoryId: virtualCategory._id,
            credit: 1000
        });
        console.log('Added Virtual Credits:', virtualCredits.credit);

        const internationalCredits = await Credit.create({
            userId: user._id,
            categoryId: internationalCategory._id,
            credit: 500
        });
        console.log('Added International Credits:', internationalCredits.credit);

        // Create Virtual Campaign
        const virtualCampaign = await Campaign.create({
            name: "Test Virtual Campaign",
            type: "VIRTUAL_QUICK",
            userId: user._id,
            message: {
                text: "Hello from Virtual Campaign"
            },
            recipients: [
                {
                    phoneNumber: "+1234567890"
                }
            ]
        });
        console.log('Created Virtual Campaign:', virtualCampaign._id);

        // Add campaign to category
        await virtualCategory.addCampaign(virtualCampaign._id, "VIRTUAL_QUICK");
        console.log('Added Virtual Campaign to category');

        // Create International Campaign
        const internationalCampaign = await Campaign.create({
            name: "Test International Campaign",
            type: "INTERNATIONAL_VIRTUAL_QUICK",
            userId: user._id,
            message: {
                text: "Hello from International Campaign"
            },
            recipients: [
                {
                    phoneNumber: "+44123456789"
                }
            ]
        });
        console.log('Created International Campaign:', internationalCampaign._id);

        // Add campaign to category
        await internationalCategory.addCampaign(internationalCampaign._id, "INTERNATIONAL_VIRTUAL_QUICK");
        console.log('Added International Campaign to category');

        // Test credit balances
        const virtualBalance = await Credit.findOne({
            userId: user._id,
            categoryId: virtualCategory._id
        });
        console.log('Virtual Credits Balance:', virtualBalance.credit);

        const internationalBalance = await Credit.findOne({
            userId: user._id,
            categoryId: internationalCategory._id
        });
        console.log('International Credits Balance:', internationalBalance.credit);

        // Test category campaigns
        const virtualCategoryWithCampaigns = await Category.findById(virtualCategory._id)
            .populate('campaignTypes.campaignIds');
        console.log('Virtual Category Campaigns:', 
            virtualCategoryWithCampaigns.campaignTypes[0].campaignIds.map(c => c.name));

        const internationalCategoryWithCampaigns = await Category.findById(internationalCategory._id)
            .populate('campaignTypes.campaignIds');
        console.log('International Category Campaigns:', 
            internationalCategoryWithCampaigns.campaignTypes[0].campaignIds.map(c => c.name));

        console.log('Test completed successfully');
    } catch (error) {
        console.error('Test failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

testCreditSystem(); 