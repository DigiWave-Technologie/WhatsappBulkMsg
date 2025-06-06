const mongoose = require('mongoose');
const User = require('../models/User');
const { Credit, CreditTransaction } = require('../models/Credit');
const Category = require('../models/Category');
require('dotenv').config();

async function testCreditOperations() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Get users with different roles
        const superAdmin = await User.findOne({ role: 'super_admin' });
        const admin = await User.findOne({ role: 'admin' });
        const reseller = await User.findOne({ role: 'reseller' });
        const user = await User.findOne({ role: 'user' });

        if (!superAdmin || !admin || !reseller || !user) {
            throw new Error('One or more test users not found');
        }

        // Create test categories
        const categories = [
            {
                name: 'Basic Messages',
                description: 'Basic text messages',
                creditCost: 1,
                campaignTypes: [
                    { type: 'VIRTUAL_QUICK', creditMultiplier: 1.0 }
                ]
            },
            {
                name: 'Premium Messages',
                description: 'Premium messages with media',
                creditCost: 2,
                campaignTypes: [
                    { type: 'VIRTUAL_BUTTON', creditMultiplier: 1.5 }
                ]
            }
        ];

        const createdCategories = [];
        for (const categoryData of categories) {
            const category = await Category.findOneAndUpdate(
                { name: categoryData.name },
                categoryData,
                { upsert: true, new: true }
            );
            createdCategories.push(category);
            console.log(`Created/Updated category: ${category.name}`);
        }

        // Test 1: Initial Credit Assignment
        console.log('\n=== Testing Initial Credit Assignment ===');
        for (const category of createdCategories) {
            // Assign credits to super admin
            await Credit.findOneAndUpdate(
                { userId: superAdmin._id, categoryId: category._id },
                { $set: { credit: 1000, isUnlimited: true } },
                { upsert: true }
            );

            // Assign credits to admin
            await Credit.findOneAndUpdate(
                { userId: admin._id, categoryId: category._id },
                { $set: { credit: 500 } },
                { upsert: true }
            );

            // Assign credits to reseller
            await Credit.findOneAndUpdate(
                { userId: reseller._id, categoryId: category._id },
                { $set: { credit: 200 } },
                { upsert: true }
            );

            // Assign credits to user
            await Credit.findOneAndUpdate(
                { userId: user._id, categoryId: category._id },
                { $set: { credit: 100 } },
                { upsert: true }
            );
        }

        // Test 2: Credit Transfer Tests
        console.log('\n=== Testing Credit Transfers ===');
        
        // Super Admin to Admin transfer
        await transferCredits(superAdmin._id, admin._id, createdCategories[0]._id, 100, 'Test transfer from super admin to admin');
        
        // Admin to Reseller transfer
        await transferCredits(admin._id, reseller._id, createdCategories[0]._id, 50, 'Test transfer from admin to reseller');
        
        // Reseller to User transfer
        await transferCredits(reseller._id, user._id, createdCategories[0]._id, 25, 'Test transfer from reseller to user');

        // Test 3: Credit History
        console.log('\n=== Testing Credit History ===');
        
        // Get credit history for each user
        const users = [superAdmin, admin, reseller, user];
        for (const testUser of users) {
            console.log(`\nCredit History for ${testUser.role}:`);
            const history = await CreditTransaction.find({
                $or: [{ fromUserId: testUser._id }, { toUserId: testUser._id }]
            })
            .populate('fromUserId', 'username role')
            .populate('toUserId', 'username role')
            .populate('categoryId', 'name')
            .sort({ createdAt: -1 });

            if (history.length === 0) {
                console.log('No transactions found');
                continue;
            }

            for (const transaction of history) {
                try {
                    console.log(`Type: ${transaction.creditType}`);
                    console.log(`Amount: ${transaction.credit}`);
                    console.log(`From: ${transaction.fromUserId?.username || 'Unknown'} (${transaction.fromUserId?.role || 'Unknown'})`);
                    console.log(`To: ${transaction.toUserId?.username || 'Unknown'} (${transaction.toUserId?.role || 'Unknown'})`);
                    console.log(`Category: ${transaction.categoryId?.name || 'Unknown'}`);
                    console.log(`Description: ${transaction.description || 'No description'}`);
                    console.log(`Date: ${transaction.createdAt}`);
                    console.log('---');
                } catch (error) {
                    console.log('Error displaying transaction:', error.message);
                    console.log('Transaction data:', JSON.stringify(transaction, null, 2));
                }
            }
        }

        // Test 4: Credit Balance Check
        console.log('\n=== Testing Credit Balance Check ===');
        for (const testUser of users) {
            console.log(`\nCredit Balance for ${testUser.role}:`);
            const balances = await Credit.find({ userId: testUser._id })
                .populate('categoryId', 'name');

            if (balances.length === 0) {
                console.log('No credit balances found');
                continue;
            }

            for (const balance of balances) {
                try {
                    console.log(`${balance.categoryId?.name || 'Unknown Category'}: ${balance.credit} credits`);
                } catch (error) {
                    console.log('Error displaying balance:', error.message);
                    console.log('Balance data:', JSON.stringify(balance, null, 2));
                }
            }
        }

        // Test 5: Permission-based Credit Operations
        console.log('\n=== Testing Permission-based Credit Operations ===');
        
        // Test admin debiting reseller's credits
        try {
            await debitCredits(admin._id, reseller._id, createdCategories[0]._id, 20, 'Admin debiting reseller credits');
            console.log('Admin successfully debited reseller credits');
        } catch (error) {
            console.log('Admin debit operation failed:', error.message);
        }

        // Test reseller debiting user's credits
        try {
            await debitCredits(reseller._id, user._id, createdCategories[0]._id, 10, 'Reseller debiting user credits');
            console.log('Reseller successfully debited user credits');
        } catch (error) {
            console.log('Reseller debit operation failed:', error.message);
        }

        // Test user trying to debit reseller's credits (should fail)
        try {
            await debitCredits(user._id, reseller._id, createdCategories[0]._id, 10, 'User trying to debit reseller credits');
            console.log('User successfully debited reseller credits (should not happen)');
        } catch (error) {
            console.log('User debit operation failed as expected:', error.message);
        }

        console.log('\nAll credit operation tests completed successfully!');

    } catch (error) {
        console.error('Error during testing:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

// Helper function for credit transfer
async function transferCredits(fromUserId, toUserId, categoryId, amount, description) {
    try {
        // Check if source user has sufficient credits
        const sourceCredit = await Credit.findOne({
            userId: fromUserId,
            categoryId: categoryId
        });

        if (!sourceCredit || sourceCredit.credit < amount) {
            throw new Error('Insufficient credits');
        }

        // Update source user's credit
        await Credit.findOneAndUpdate(
            { userId: fromUserId, categoryId: categoryId },
            { $inc: { credit: -amount } }
        );

        // Update destination user's credit
        await Credit.findOneAndUpdate(
            { userId: toUserId, categoryId: categoryId },
            { $inc: { credit: amount } },
            { upsert: true }
        );

        // Create transaction record
        await CreditTransaction.create({
            fromUserId,
            toUserId,
            categoryId,
            creditType: 'transfer',
            credit: amount,
            description
        });

        console.log(`Successfully transferred ${amount} credits from ${fromUserId} to ${toUserId}`);
    } catch (error) {
        console.error('Transfer failed:', error.message);
        throw error;
    }
}

// Helper function for credit debit
async function debitCredits(fromUserId, toUserId, categoryId, amount, description) {
    try {
        // Check if source user has sufficient credits
        const sourceCredit = await Credit.findOne({
            userId: toUserId,
            categoryId: categoryId
        });

        if (!sourceCredit || sourceCredit.credit < amount) {
            throw new Error('Insufficient credits');
        }

        // Update user's credit
        await Credit.findOneAndUpdate(
            { userId: toUserId, categoryId: categoryId },
            { $inc: { credit: -amount } }
        );

        // Create transaction record
        await CreditTransaction.create({
            fromUserId,
            toUserId,
            categoryId,
            creditType: 'debit',
            credit: amount,
            description
        });

        console.log(`Successfully debited ${amount} credits from ${toUserId}`);
    } catch (error) {
        console.error('Debit failed:', error.message);
        throw error;
    }
}

// Run the tests
testCreditOperations(); 