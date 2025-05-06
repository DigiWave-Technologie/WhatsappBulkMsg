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
    creditAmounts: [10, 50, 100, 500, 1000]
};

async function testCreditAndCategoryManagement() {
    try {
        // Connect to MongoDB with updated connection string
        await mongoose.connect('mongodb://127.0.0.1:27017/whatsapp_bulk_campaign', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to MongoDB');

        // Create test users
        const superAdmin = await User.findOne({ role: 'super_admin' });
        if (!superAdmin) {
            throw new Error('Super admin not found');
        }

        const testUser = await User.findOne({ role: 'user' });
        if (!testUser) {
            throw new Error('Test user not found');
        }

        // Test 1: Create Categories
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

        // Test 2: Credit Transfer with Different Time Durations
        console.log('\n=== Testing Credit Transfer with Different Time Durations ===');
        for (const category of createdCategories) {
            for (const duration of testData.timeDurations) {
                for (const amount of testData.creditAmounts) {
                    console.log(`\nTesting credit transfer for ${category.name} with ${duration} duration and ${amount} credits`);

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
                                expiryDate = new Date(now.setDate(now.getDate() + 15)); // 15 days
                                break;
                            case 'specific_date':
                                expiryDate = new Date(now.setMonth(now.getMonth() + 1, 0)); // End of next month
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
                        description: `Test credit transfer for ${category.name} with ${duration} duration`
                    });

                    console.log(`Transferred ${amount} credits for ${category.name}`);
                    console.log('Credit details:', {
                        balance: credit.credit,
                        duration: credit.timeDuration,
                        expiry: credit.expiryDate
                    });
                }
            }
        }

        // Test 3: Credit Usage and Deduction
        console.log('\n=== Testing Credit Usage and Deduction ===');
        for (const category of createdCategories) {
            const credit = await Credit.findOne({
                userId: testUser._id,
                categoryId: category._id
            });

            if (credit) {
                const deductionAmount = Math.floor(credit.credit / 2);
                console.log(`\nTesting credit deduction for ${category.name}`);
                console.log('Before deduction:', credit.credit);

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
                    description: `Test credit deduction for ${category.name}`
                });

                const updatedCredit = await Credit.findOne({
                    userId: testUser._id,
                    categoryId: category._id
                });
                console.log('After deduction:', updatedCredit.credit);
            }
        }

        // Test 4: Credit Balance Check
        console.log('\n=== Testing Credit Balance Check ===');
        const userCredits = await Credit.find({ userId: testUser._id })
            .populate('categoryId', 'name creditCost');
        
        console.log('\nUser Credit Balances:');
        for (const credit of userCredits) {
            console.log(`${credit.categoryId.name}: ${credit.credit} credits`);
        }

        // Test 5: Credit Usage Statistics
        console.log('\n=== Testing Credit Usage Statistics ===');
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

        console.log('\nCredit Usage Statistics:');
        for (const stat of stats) {
            console.log(`${stat.category.name}: ${stat.totalUsed} credits used in ${stat.count} transactions`);
        }

        // Test 6: Category Update
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

        // Test 7: Category Deletion
        console.log('\n=== Testing Category Deletion ===');
        for (const category of createdCategories) {
            await Category.findByIdAndDelete(category._id);
            console.log(`Deleted category: ${category.name}`);
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