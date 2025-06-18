const mongoose = require('mongoose');
const User = require('../models/User');
const { Credit, CreditTransaction } = require('../models/Credit');
const Category = require('../models/Category');
require('dotenv').config();

async function addCreditsToSuperAdmin() {
    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/whatsapp-bulk-message';
        await mongoose.connect(mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            family: 4
        });
        console.log('Connected to MongoDB');

        // Find the super admin user
        const superAdmin = await User.findOne({ username: 'superadmin1' });
        if (!superAdmin) {
            throw new Error('Super admin user not found');
        }
        console.log('Found super admin:', superAdmin.username);

        // Create or find the virtual_credit category
        let virtualCategory = await Category.findOne({ name: 'virtual_credit' });
        if (!virtualCategory) {
            virtualCategory = await Category.create({
                name: 'virtual_credit',
                description: 'Credits for virtual WhatsApp messaging',
                creditCost: 1,
                campaignTypes: [
                    {
                        type: 'VIRTUAL_QUICK',
                        creditMultiplier: 1.0
                    }
                ],
                mediaCreditCost: 1,
                interactiveCreditCost: 1,
                isActive: true
            });
            console.log('Created virtual_credit category:', virtualCategory._id);
        } else {
            console.log('Found existing virtual_credit category:', virtualCategory._id);
        }

        // Check if super admin already has credits for this category
        let existingCredit = await Credit.findOne({
            userId: superAdmin._id,
            categoryId: virtualCategory._id
        });

        if (existingCredit) {
            // Update existing credits
            existingCredit.credit += 1000; // Add 1000 more credits
            await existingCredit.save();
            console.log('Updated existing credits. New balance:', existingCredit.credit);
        } else {
            // Create new credit record
            const newCredit = await Credit.create({
                userId: superAdmin._id,
                categoryId: virtualCategory._id,
                credit: 1000,
                isUnlimited: false,
                timeDuration: 'unlimited'
            });
            console.log('Created new credit record with 1000 credits');
        }

        // Log the transaction
        await CreditTransaction.create({
            fromUserId: superAdmin._id, // System/admin adding credits
            toUserId: superAdmin._id,
            categoryId: virtualCategory._id,
            creditType: 'credit',
            credit: 1000,
            description: 'Added credits to super admin for testing WhatsApp messaging'
        });

        console.log('✅ Successfully added 1000 credits to super admin for virtual_credit category');
        
        // Display current balance
        const currentCredit = await Credit.findOne({
            userId: superAdmin._id,
            categoryId: virtualCategory._id
        });
        console.log('Current credit balance:', currentCredit.credit);

    } catch (error) {
        console.error('❌ Error adding credits:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

// Run the script
if (require.main === module) {
    addCreditsToSuperAdmin();
}

module.exports = { addCreditsToSuperAdmin }; 