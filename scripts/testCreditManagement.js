const mongoose = require('mongoose');
const { Credit } = require('../models/Credit');
const { CreditTransaction } = require('../models/Credit');
const User = require('../models/User');
const Category = require('../models/Category');
require('dotenv').config();

async function testCreditManagement() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Find super admin
        const superAdmin = await User.findOne({ role: 'super_admin' });
        if (!superAdmin) {
            console.error('Super admin not found');
            return;
        }
        console.log('Super admin found:', superAdmin.username, '(ID:', superAdmin._id, ')');

        // Find or create a category
        let category = await Category.findOne({ name: 'Test Category' });
        if (!category) {
            category = await Category.create({
                name: 'Test Category',
                description: 'Test category for credit management',
                creditCost: 1
            });
            console.log('Created test category:', category.name, '(ID:', category._id, ')');
        } else {
            console.log('Found test category:', category.name, '(ID:', category._id, ')');
        }

        // Find or create a test user
        let testUser = await User.findOne({ username: 'testuser' });
        if (!testUser) {
            testUser = await User.create({
                username: 'testuser',
                password: 'Test@123',
                role: 'user',
                createdBy: superAdmin._id
            });
            console.log('Created test user:', testUser.username, '(ID:', testUser._id, ')');
        } else {
            console.log('Found test user:', testUser.username, '(ID:', testUser._id, ')');
        }

        // Test credit transfer with different time durations
        const timeDurations = ['unlimited', 'daily', 'weekly', 'monthly', 'yearly'];
        
        for (const duration of timeDurations) {
            console.log(`\n--- Testing credit transfer with ${duration} duration ---`);
            
            // Transfer credits from super admin to test user
            const creditAmount = 100;
            
            // Create or update credit for test user
            await Credit.findOneAndUpdate(
                { userId: testUser._id, categoryId: category._id },
                { 
                    $inc: { credit: creditAmount },
                    $set: { 
                        timeDuration: duration,
                        expiryDate: duration === 'unlimited' ? null : new Date(Date.now() + getDurationInMs(duration))
                    }
                },
                { upsert: true }
            );
            
            // Create transaction record
            await CreditTransaction.create({
                fromUserId: superAdmin._id,
                toUserId: testUser._id,
                categoryId: category._id,
                credit: creditAmount,
                creditType: 'transfer',
                description: `Test credit transfer with ${duration} duration`
            });
            
            console.log(`Transferred ${creditAmount} credits from ${superAdmin.username} (ID: ${superAdmin._id}) to ${testUser.username} (ID: ${testUser._id}) with ${duration} duration`);
            
            // Check credit balance
            const credit = await Credit.findOne({ 
                userId: testUser._id, 
                categoryId: category._id 
            }).populate('categoryId');
            
            console.log('Credit balance:', credit.credit);
            console.log('Time duration:', credit.timeDuration);
            console.log('Expiry date:', credit.expiryDate);
            
            // Wait a bit before next test
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // Test credit transfer with custom expiry date
        console.log(`\n--- Testing credit transfer with custom expiry date ---`);
        
        // Set custom expiry date (1 week from now at 3 PM)
        const customExpiryDate = new Date();
        customExpiryDate.setDate(customExpiryDate.getDate() + 7); // 1 week from now
        customExpiryDate.setHours(15, 0, 0, 0); // Set to 3 PM
        
        // Transfer credits with custom expiry date
        const customCreditAmount = 150;
        
        // Create or update credit for test user with custom expiry
        await Credit.findOneAndUpdate(
            { userId: testUser._id, categoryId: category._id },
            { 
                $inc: { credit: customCreditAmount },
                $set: { 
                    timeDuration: 'custom',
                    expiryDate: customExpiryDate
                }
            },
            { upsert: true }
        );
        
        // Create transaction record
        await CreditTransaction.create({
            fromUserId: superAdmin._id,
            toUserId: testUser._id,
            categoryId: category._id,
            credit: customCreditAmount,
            creditType: 'transfer',
            description: `Test credit transfer with custom expiry date (${customExpiryDate.toLocaleString()})`
        });
        
        console.log(`Transferred ${customCreditAmount} credits from ${superAdmin.username} (ID: ${superAdmin._id}) to ${testUser.username} (ID: ${testUser._id}) with custom expiry date`);
        
        // Check credit balance
        const customCredit = await Credit.findOne({ 
            userId: testUser._id, 
            categoryId: category._id 
        }).populate('categoryId');
        
        console.log('Credit balance:', customCredit.credit);
        console.log('Time duration:', customCredit.timeDuration);
        console.log('Expiry date:', customCredit.expiryDate);
        console.log('Expiry date (formatted):', customCredit.expiryDate.toLocaleString());
        
        // Test credit transfer with specific date (e.g., end of month)
        console.log(`\n--- Testing credit transfer with specific date (end of month) ---`);
        
        // Set expiry date to end of current month
        const endOfMonth = new Date();
        endOfMonth.setMonth(endOfMonth.getMonth() + 1, 0); // Last day of current month
        endOfMonth.setHours(23, 59, 59, 999); // End of day
        
        // Transfer credits with end of month expiry
        const specificDateCreditAmount = 200;
        
        // Create or update credit for test user with specific date
        await Credit.findOneAndUpdate(
            { userId: testUser._id, categoryId: category._id },
            { 
                $inc: { credit: specificDateCreditAmount },
                $set: { 
                    timeDuration: 'specific_date',
                    expiryDate: endOfMonth
                }
            },
            { upsert: true }
        );
        
        // Create transaction record
        await CreditTransaction.create({
            fromUserId: superAdmin._id,
            toUserId: testUser._id,
            categoryId: category._id,
            credit: specificDateCreditAmount,
            creditType: 'transfer',
            description: `Test credit transfer with specific expiry date (end of month: ${endOfMonth.toLocaleString()})`
        });
        
        console.log(`Transferred ${specificDateCreditAmount} credits from ${superAdmin.username} (ID: ${superAdmin._id}) to ${testUser.username} (ID: ${testUser._id}) with specific expiry date`);
        
        // Check credit balance
        const specificDateCredit = await Credit.findOne({ 
            userId: testUser._id, 
            categoryId: category._id 
        }).populate('categoryId');
        
        console.log('Credit balance:', specificDateCredit.credit);
        console.log('Time duration:', specificDateCredit.timeDuration);
        console.log('Expiry date:', specificDateCredit.expiryDate);
        console.log('Expiry date (formatted):', specificDateCredit.expiryDate.toLocaleString());
        
        // Display recent transactions
        console.log('\n--- Recent Credit Transactions ---');
        const recentTransactions = await CreditTransaction.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .lean();
        
        for (const transaction of recentTransactions) {
            const fromUser = await User.findById(transaction.fromUserId).lean();
            const toUser = await User.findById(transaction.toUserId).lean();
            
            console.log(`Transaction ID: ${transaction._id}`);
            console.log(`From: ${fromUser ? fromUser.username : 'Unknown'} (ID: ${transaction.fromUserId})`);
            console.log(`To: ${toUser ? toUser.username : 'Unknown'} (ID: ${transaction.toUserId})`);
            console.log(`Amount: ${transaction.credit}`);
            console.log(`Type: ${transaction.creditType}`);
            console.log(`Description: ${transaction.description || 'N/A'}`);
            console.log(`Date: ${transaction.createdAt}`);
            console.log('-----------------------------------');
        }
        
        console.log('\nCredit management test completed successfully');

    } catch (error) {
        console.error('Error testing credit management:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

// Helper function to get duration in milliseconds
function getDurationInMs(duration) {
    switch (duration) {
        case 'daily':
            return 24 * 60 * 60 * 1000;
        case 'weekly':
            return 7 * 24 * 60 * 60 * 1000;
        case 'monthly':
            return 30 * 24 * 60 * 60 * 1000;
        case 'yearly':
            return 365 * 24 * 60 * 60 * 1000;
        default:
            return 0;
    }
}

testCreditManagement(); 