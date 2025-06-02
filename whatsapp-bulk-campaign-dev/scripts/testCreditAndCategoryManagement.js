const mongoose = require('mongoose');
const { Credit, CreditTransaction } = require('../models/Credit');
const Category = require('../models/Category');
const User = require('../models/User');
require('dotenv').config();

// Test data
const testData = {
    categories: [
        {
            name: 'Marketing',
            description: 'Marketing related templates',
            creditCost: 1
        },
        {
            name: 'Utility',
            description: 'Utility related templates',
            creditCost: 2
        },
        {
            name: 'Authentication',
            description: 'Authentication related templates',
            creditCost: 3
        }
    ],
    timeDurations: ['unlimited', 'daily', 'weekly', 'monthly', 'yearly', 'custom', 'specific_date'],
    creditAmounts: [10, 50, 100, 500, 1000],
    edgeCases: {
        negativeCredits: -100,
        zeroCredits: 0,
        largeCredits: 1000000,
        decimalCredits: 10.5,
        expiredDate: new Date(Date.now() - 86400000), // Yesterday
        farFutureDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        invalidDurations: ['invalid', 'test', 'random']
    }
};

async function testCreditAndCategoryManagement() {
    try {
        // Connect to MongoDB with updated connection string
        await mongoose.connect('mongodb://127.0.0.1:27017/whatsapp_bulk_campaign', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to MongoDB');

        // Get users with different roles
        const superAdmin = await User.findOne({ role: 'super_admin' });
        const admin = await User.findOne({ role: 'admin' });
        const reseller = await User.findOne({ role: 'reseller' });
        const user = await User.findOne({ role: 'user' });

        if (!superAdmin || !admin || !reseller || !user) {
            throw new Error('One or more test users not found');
        }

        console.log('\n=== Testing with Different User Roles ===');
        const testUsers = [
            { user: superAdmin, role: 'super_admin' },
            { user: admin, role: 'admin' },
            { user: reseller, role: 'reseller' },
            { user: user, role: 'user' }
        ];

        // Test 1: Create Categories (Super Admin only)
        console.log('\n=== Testing Category Creation ===');
        const createdCategories = [];
        for (const categoryData of testData.categories) {
            const category = await Category.findOneAndUpdate(
                { name: categoryData.name },
                categoryData,
                { upsert: true, new: true }
            );
            createdCategories.push(category);
            console.log(`Created/Updated category: ${category.name}`);
        }

        // Test 2: Credit Transfer with Different Time Durations for each role
        console.log('\n=== Testing Credit Transfer with Different Time Durations ===');
        for (const { user: testUser, role } of testUsers) {
            console.log(`\nTesting credit transfers for ${role}`);
            
            for (const category of createdCategories) {
                for (const duration of testData.timeDurations) {
                    for (const amount of testData.creditAmounts) {
                        try {
                            console.log(`\nTesting credit transfer for ${role} - ${category.name} with ${duration} duration and ${amount} credits`);

                            // Calculate expiry date based on duration
                            let expiryDate = null;
                            if (duration !== 'unlimited') {
                                const now = new Date();
                                switch (duration) {
                                    case 'daily':
                                        expiryDate = new Date(now.setDate(now.getDate() + 1));
                                        break;
                                    case 'weekly':
                                        expiryDate = new Date(now.setDate(now.getDate() + 7));
                                        break;
                                    case 'monthly':
                                        expiryDate = new Date(now.setMonth(now.getMonth() + 1));
                                        break;
                                    case 'yearly':
                                        expiryDate = new Date(now.setFullYear(now.getFullYear() + 1));
                                        break;
                                    case 'custom':
                                        expiryDate = new Date(now.setDate(now.getDate() + 15));
                                        break;
                                    case 'specific_date':
                                        expiryDate = new Date(now.setMonth(now.getMonth() + 1, 0));
                                        break;
                                }
                            }

                            // Create or update credit
                            const credit = await Credit.findOneAndUpdate(
                                { userId: testUser._id, categoryId: category._id },
                                {
                                    $inc: { credit: amount },
                                    $set: {
                                        timeDuration: duration,
                                        expiryDate: expiryDate,
                                        lastUsed: new Date()
                                    }
                                },
                                { upsert: true, new: true }
                            );

                            // Create transaction record
                            await CreditTransaction.create({
                                fromUserId: superAdmin._id,
                                toUserId: testUser._id,
                                categoryId: category._id,
                                credit: amount,
                                creditType: 'transfer',
                                description: `Test credit transfer for ${role} - ${category.name} with ${duration} duration`
                            });

                            console.log(`Transferred ${amount} credits for ${category.name}`);
                            console.log('Credit details:', {
                                balance: credit.credit,
                                duration: credit.timeDuration,
                                expiry: credit.expiryDate
                            });
                        } catch (error) {
                            console.error(`Error in credit transfer for ${role}:`, error.message);
                        }
                    }
                }
            }
        }

        // Test 3: Edge Cases
        console.log('\n=== Testing Edge Cases ===');
        for (const { user: testUser, role } of testUsers) {
            console.log(`\nTesting edge cases for ${role}`);
            
            // Test negative credits
            try {
                await Credit.findOneAndUpdate(
                    { userId: testUser._id, categoryId: createdCategories[0]._id },
                    { $inc: { credit: testData.edgeCases.negativeCredits } }
                );
                console.log(`Attempted to add negative credits (${testData.edgeCases.negativeCredits})`);
            } catch (error) {
                console.log(`Negative credit test failed as expected: ${error.message}`);
            }

            // Test zero credits
            try {
                await Credit.findOneAndUpdate(
                    { userId: testUser._id, categoryId: createdCategories[0]._id },
                    { $inc: { credit: testData.edgeCases.zeroCredits } }
                );
                console.log('Zero credit transfer successful');
            } catch (error) {
                console.log(`Zero credit test failed: ${error.message}`);
            }

            // Test expired credits
            try {
                await Credit.findOneAndUpdate(
                    { userId: testUser._id, categoryId: createdCategories[0]._id },
                    {
                        $set: {
                            expiryDate: testData.edgeCases.expiredDate,
                            timeDuration: 'daily'
                        }
                    }
                );
                console.log('Set expired date successfully');
            } catch (error) {
                console.log(`Expired date test failed: ${error.message}`);
            }

            // Test invalid duration
            try {
                await Credit.findOneAndUpdate(
                    { userId: testUser._id, categoryId: createdCategories[0]._id },
                    {
                        $set: {
                            timeDuration: testData.edgeCases.invalidDurations[0]
                        }
                    }
                );
                console.log('Attempted to set invalid duration');
            } catch (error) {
                console.log(`Invalid duration test failed as expected: ${error.message}`);
            }
        }

        // Test 4: Credit Usage and Deduction
        console.log('\n=== Testing Credit Usage and Deduction ===');
        for (const { user: testUser, role } of testUsers) {
            console.log(`\nTesting credit deduction for ${role}`);
            
            for (const category of createdCategories) {
                const credit = await Credit.findOne({
                    userId: testUser._id,
                    categoryId: category._id
                });

                if (credit) {
                    const deductionAmount = Math.floor(credit.credit / 2);
                    console.log(`\nTesting credit deduction for ${category.name}`);
                    console.log('Before deduction:', credit.credit);

                    try {
                        // Deduct credits
                        await Credit.findOneAndUpdate(
                            { userId: testUser._id, categoryId: category._id },
                            { $inc: { credit: -deductionAmount } }
                        );

                        // Log transaction
                        await CreditTransaction.create({
                            fromUserId: testUser._id,
                            toUserId: testUser._id,
                            categoryId: category._id,
                            credit: deductionAmount,
                            creditType: 'debit',
                            description: `Test credit deduction for ${role} - ${category.name}`
                        });

                        const updatedCredit = await Credit.findOne({
                            userId: testUser._id,
                            categoryId: category._id
                        });
                        console.log('After deduction:', updatedCredit.credit);
                    } catch (error) {
                        console.error(`Error in credit deduction for ${role}:`, error.message);
                    }
                }
            }
        }

        // Test 5: Credit Balance Check
        console.log('\n=== Testing Credit Balance Check ===');
        for (const { user: testUser, role } of testUsers) {
            console.log(`\nCredit Balance for ${role}:`);
            try {
                const userCredits = await Credit.find({ userId: testUser._id })
                    .populate('categoryId', 'name creditCost');
                
                if (userCredits && userCredits.length > 0) {
                    for (const credit of userCredits) {
                        if (credit.categoryId) {
                            console.log(`${credit.categoryId.name}: ${credit.credit} credits`);
                        } else {
                            console.log(`Category not found for credit ID: ${credit._id}`);
                        }
                    }
                } else {
                    console.log('No credits found for this user');
                }
            } catch (error) {
                console.error(`Error checking credit balance for ${role}:`, error.message);
            }
        }

        // Test 6: Credit Usage Statistics
        console.log('\n=== Testing Credit Usage Statistics ===');
        for (const { user: testUser, role } of testUsers) {
            console.log(`\nCredit Usage Statistics for ${role}:`);
            const stats = await CreditTransaction.aggregate([
                {
                    $match: {
                        fromUserId: testUser._id
                    }
                },
                {
                    $group: {
                        _id: '$categoryId',
                        totalUsed: { $sum: '$credit' },
                        count: { $sum: 1 }
                    }
                },
                {
                    $lookup: {
                        from: 'categories',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'category'
                    }
                },
                {
                    $unwind: '$category'
                }
            ]);

            for (const stat of stats) {
                console.log(`${stat.category.name}: ${stat.totalUsed} credits used in ${stat.count} transactions`);
            }
        }

        // Test 7: Category Update (Super Admin only)
        console.log('\n=== Testing Category Update ===');
        for (const category of createdCategories) {
            const newCreditCost = category.creditCost * 2;
            const updatedCategory = await Category.findByIdAndUpdate(
                category._id,
                { creditCost: newCreditCost },
                { new: true }
            );
            console.log(`Updated ${category.name} credit cost from ${category.creditCost} to ${newCreditCost}`);
        }

        // Test 8: Category Deletion (Super Admin only)
        console.log('\n=== Testing Category Deletion ===');
        for (const category of createdCategories) {
            await Category.findByIdAndDelete(category._id);
            console.log(`Deleted category: ${category.name}`);
        }

        // Test 9: Concurrent Operations
        console.log('\n=== Testing Concurrent Credit Operations ===');
        const concurrentOps = [];
        for (let i = 0; i < 5; i++) {
            concurrentOps.push(
                Credit.findOneAndUpdate(
                    { userId: user._id, categoryId: createdCategories[0]._id },
                    { $inc: { credit: 10 } },
                    { new: true }
                )
            );
        }
        const concurrentResults = await Promise.all(concurrentOps);
        console.log('Concurrent credit increments completed. Final balance:', concurrentResults[concurrentResults.length - 1].credit);

        // Test 10: Invalid User/Category IDs
        console.log('\n=== Testing Invalid User/Category IDs ===');
        try {
            await Credit.findOneAndUpdate(
                { userId: mongoose.Types.ObjectId(), categoryId: createdCategories[0]._id },
                { $inc: { credit: 10 } }
            );
            console.log('No error for invalid user ID (should be handled gracefully)');
        } catch (error) {
            console.log('Error for invalid user ID:', error.message);
        }
        try {
            await Credit.findOneAndUpdate(
                { userId: user._id, categoryId: mongoose.Types.ObjectId() },
                { $inc: { credit: 10 } }
            );
            console.log('No error for invalid category ID (should be handled gracefully)');
        } catch (error) {
            console.log('Error for invalid category ID:', error.message);
        }

        // Test 11: Permission Enforcement
        console.log('\n=== Testing Permission Enforcement ===');
        // Only super_admin should be able to create/delete categories
        try {
            if (admin) {
                await Category.create({ name: 'AdminTest', description: 'Should fail', creditCost: 1 });
                console.log('Admin was able to create a category (should be restricted in production)');
            }
        } catch (error) {
            console.log('Admin create category error (expected if restricted):', error.message);
        }
        try {
            if (reseller) {
                await Category.create({ name: 'ResellerTest', description: 'Should fail', creditCost: 1 });
                console.log('Reseller was able to create a category (should be restricted in production)');
            }
        } catch (error) {
            console.log('Reseller create category error (expected if restricted):', error.message);
        }
        try {
            if (user) {
                await Category.create({ name: 'UserTest', description: 'Should fail', creditCost: 1 });
                console.log('User was able to create a category (should be restricted in production)');
            }
        } catch (error) {
            console.log('User create category error (expected if restricted):', error.message);
        }

        console.log('\nAll tests completed successfully!');

    } catch (error) {
        console.error('Error during testing:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

// Run the tests
testCreditAndCategoryManagement(); 