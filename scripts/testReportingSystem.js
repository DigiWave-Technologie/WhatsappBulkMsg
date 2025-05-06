const mongoose = require('mongoose');
const User = require('../models/User');
const Campaign = require('../models/Campaign');
const MessageLog = require('../models/MessageLog');
const CreditTransaction = require('../models/CreditTransaction');
const Template = require('../models/Template');
const Group = require('../models/Group');
const Category = require('../models/Category');
require('dotenv').config();

// Test data
const testData = {
    users: [
        {
            username: 'superadmin',
            password: 'Test@123',
            role: 'super_admin',
            email: 'superadmin@test.com'
        },
        {
            username: 'admin',
            password: 'Test@123',
            role: 'admin',
            email: 'admin@test.com'
        },
        {
            username: 'reseller',
            password: 'Test@123',
            role: 'reseller',
            email: 'reseller@test.com'
        },
        {
            username: 'user1',
            password: 'Test@123',
            role: 'user',
            email: 'user1@test.com'
        },
        {
            username: 'user2',
            password: 'Test@123',
            role: 'user',
            email: 'user2@test.com'
        }
    ],
    templates: [
        {
            name: 'Marketing Template',
            content: 'Hello {{name}}, welcome to our service!',
            category: 'marketing',
            language: 'en',
            status: 'approved',
            variables: [
                { name: 'name', type: 'string', required: true }
            ]
        },
        {
            name: 'Utility Template',
            content: 'Your order #{{order_id}} has been shipped.',
            category: 'utility',
            language: 'en',
            status: 'approved',
            variables: [
                { name: 'order_id', type: 'string', required: true }
            ]
        },
        {
            name: 'Authentication Template',
            content: 'Your OTP is {{otp}}. Valid for {{minutes}} minutes.',
            category: 'authentication',
            language: 'en',
            status: 'approved',
            variables: [
                { name: 'otp', type: 'string', required: true },
                { name: 'minutes', type: 'number', required: true }
            ]
        }
    ],
    groups: [
        {
            group_name: 'Marketing Group',
            group_number: '123456789@g.us'
        },
        {
            group_name: 'Utility Group',
            group_number: '987654321@g.us'
        },
        {
            group_name: 'Authentication Group',
            group_number: '456789123@g.us'
        }
    ],
    campaigns: [
        {
            name: 'Marketing Campaign 1',
            type: 'marketing',
            status: 'completed',
            totalRecipients: 100,
            successCount: 90,
            failureCount: 10
        },
        {
            name: 'Utility Campaign 1',
            type: 'utility',
            status: 'running',
            totalRecipients: 50,
            successCount: 45,
            failureCount: 5
        },
        {
            name: 'Authentication Campaign 1',
            type: 'authentication',
            status: 'draft',
            totalRecipients: 30,
            successCount: 0,
            failureCount: 0
        }
    ],
    messageLogs: [
        {
            messageId: 'msg_123456789',
            recipient: '+1234567890',
            messageType: 'text',
            content: 'Hello, this is a test message',
            status: 'sent',
            timestamp: new Date(Date.now() - 86400000) // 1 day ago
        },
        {
            messageId: 'msg_987654321',
            recipient: '+1987654321',
            messageType: 'template',
            content: {
                templateName: 'Welcome Template',
                variables: { name: 'John' }
            },
            status: 'delivered',
            timestamp: new Date(Date.now() - 172800000) // 2 days ago
        },
        {
            messageId: 'msg_456789123',
            recipient: '+1122334455',
            messageType: 'media',
            content: {
                type: 'image',
                url: 'https://example.com/image.jpg',
                caption: 'Test image'
            },
            status: 'read',
            timestamp: new Date(Date.now() - 259200000) // 3 days ago
        }
    ]
};

async function testReportingSystem() {
    try {
        // Connect to MongoDB
        await mongoose.connect('mongodb://127.0.0.1:27017/whatsapp_bulk_campaign', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to MongoDB');

        // Clean up existing test data
        console.log('\n=== Cleaning up Existing Test Data ===');
        await MessageLog.deleteMany({ messageId: { $in: ['msg_123456789', 'msg_987654321', 'msg_456789123'] } });
        await CreditTransaction.deleteMany({});
        await Campaign.deleteMany({});
        await Group.deleteMany({});
        await Template.deleteMany({});
        await Category.deleteMany({});
        await User.deleteMany({ username: { $in: ['superadmin', 'admin', 'reseller', 'user1', 'user2'] } });
        console.log('Cleanup completed');

        // Create test users
        console.log('\n=== Creating Test Users ===');
        const createdUsers = [];
        for (const userData of testData.users) {
            const user = await User.findOneAndUpdate(
                { username: userData.username },
                userData,
                { upsert: true, new: true }
            );
            createdUsers.push(user);
            console.log(`Created/Updated user: ${user.username} (${user.role})`);
        }

        // Create test templates
        console.log('\n=== Creating Test Templates ===');
        const createdTemplates = [];
        for (const templateData of testData.templates) {
            const template = await Template.create({
                ...templateData,
                userId: createdUsers[3]._id // Assign to user1
            });
            createdTemplates.push(template);
            console.log(`Created template: ${template.name}`);
        }

        // Create test groups
        console.log('\n=== Creating Test Groups ===');
        const createdGroups = [];
        for (const groupData of testData.groups) {
            const group = await Group.create({
                ...groupData,
                userId: createdUsers[3]._id // Assign to user1
            });
            createdGroups.push(group);
            console.log(`Created group: ${group.group_name}`);
        }

        // Create test campaigns
        console.log('\n=== Creating Test Campaigns ===');
        const createdCampaigns = [];
        for (let i = 0; i < testData.campaigns.length; i++) {
            const campaignData = testData.campaigns[i];
            const campaign = await Campaign.create({
                ...campaignData,
                userId: createdUsers[3]._id, // Assign to user1
                templateId: createdTemplates[i]._id,
                groupId: createdGroups[i]._id
            });
            createdCampaigns.push(campaign);
            console.log(`Created campaign: ${campaign.name}`);
        }

        // Create test message logs
        console.log('\n=== Creating Test Message Logs ===');
        const createdMessageLogs = [];
        for (const logData of testData.messageLogs) {
            const messageLog = await MessageLog.create({
                ...logData,
                userId: createdUsers[3]._id, // Assign to user1
                campaignId: createdCampaigns[0]._id
            });
            createdMessageLogs.push(messageLog);
            console.log(`Created message log: ${messageLog.type} - ${messageLog.status}`);
        }

        // Create test categories
        console.log('\n=== Creating Test Categories ===');
        const categories = [
            {
                name: 'marketing',
                description: 'Marketing messages',
                creditCost: 1
            },
            {
                name: 'utility',
                description: 'Utility messages',
                creditCost: 2
            },
            {
                name: 'authentication',
                description: 'Authentication messages',
                creditCost: 3
            }
        ];

        const createdCategories = [];
        for (const categoryData of categories) {
            const category = await Category.create(categoryData);
            createdCategories.push(category);
            console.log(`Created category: ${category.name}`);
        }

        // Create test credit transactions
        console.log('\n=== Creating Test Credit Transactions ===');
        const creditTransactions = [
            {
                fromUserId: createdUsers[3]._id, // user1
                toUserId: createdUsers[4]._id, // user2
                categoryId: createdCategories[0]._id, // marketing category
                creditType: 'transfer',
                credit: 100,
                description: 'Credit transfer from user1 to user2'
            },
            {
                fromUserId: createdUsers[3]._id, // user1
                toUserId: createdUsers[3]._id, // user1
                categoryId: createdCategories[1]._id, // utility category
                creditType: 'debit',
                credit: 50,
                description: 'Credit debit for service usage'
            },
            {
                fromUserId: createdUsers[2]._id, // reseller
                toUserId: createdUsers[3]._id, // user1
                categoryId: createdCategories[2]._id, // authentication category
                creditType: 'credit',
                credit: 25,
                description: 'Credit bonus from reseller'
            }
        ];

        const createdTransactions = [];
        for (const transactionData of creditTransactions) {
            const transaction = await CreditTransaction.create(transactionData);
            createdTransactions.push(transaction);
            console.log(`Created transaction: ${transaction.creditType} - ${transaction.credit}`);
        }

        // Test 1: System-wide Statistics
        console.log('\n=== Testing System-wide Statistics ===');
        const systemStats = await MessageLog.aggregate([
            {
                $group: {
                    _id: {
                        type: '$type',
                        status: '$status'
                    },
                    count: { $sum: 1 }
                }
            }
        ]);
        console.log('System Message Statistics:', systemStats);

        // Test 2: Admin-level Statistics
        console.log('\n=== Testing Admin-level Statistics ===');
        const adminStats = await Campaign.aggregate([
            {
                $group: {
                    _id: '$type',
                    totalCampaigns: { $sum: 1 },
                    totalRecipients: { $sum: '$totalRecipients' },
                    successRate: {
                        $avg: {
                            $multiply: [
                                { $divide: ['$successCount', '$totalRecipients'] },
                                100
                            ]
                        }
                    }
                }
            }
        ]);
        console.log('Admin Campaign Statistics:', adminStats);

        // Test 3: Reseller-level Statistics
        console.log('\n=== Testing Reseller-level Statistics ===');
        const resellerStats = await CreditTransaction.aggregate([
            {
                $group: {
                    _id: '$type',
                    totalAmount: { $sum: '$amount' },
                    transactionCount: { $sum: 1 }
                }
            }
        ]);
        console.log('Reseller Credit Statistics:', resellerStats);

        // Test 4: User-level Statistics
        console.log('\n=== Testing User-level Statistics ===');
        const userStats = await MessageLog.aggregate([
            {
                $match: {
                    userId: createdUsers[3]._id // user1
                }
            },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);
        console.log('User Message Statistics:', userStats);

        // Test 5: Campaign Reports
        console.log('\n=== Testing Campaign Reports ===');
        const campaignReports = await Campaign.aggregate([
            {
                $lookup: {
                    from: 'messagelogs',
                    localField: '_id',
                    foreignField: 'campaignId',
                    as: 'messages'
                }
            },
            {
                $project: {
                    name: 1,
                    type: 1,
                    status: 1,
                    totalRecipients: 1,
                    successCount: 1,
                    failureCount: 1,
                    messageCount: { $size: '$messages' }
                }
            }
        ]);
        console.log('Campaign Reports:', campaignReports);

        // Cleanup
        console.log('\n=== Cleaning up Test Data ===');
        await MessageLog.deleteMany({ _id: { $in: createdMessageLogs.map(log => log._id) } });
        await CreditTransaction.deleteMany({ _id: { $in: createdTransactions.map(t => t._id) } });
        await Campaign.deleteMany({ _id: { $in: createdCampaigns.map(c => c._id) } });
        await Group.deleteMany({ _id: { $in: createdGroups.map(g => g._id) } });
        await Template.deleteMany({ _id: { $in: createdTemplates.map(t => t._id) } });
        await User.deleteMany({ _id: { $in: createdUsers.map(u => u._id) } });
        await Category.deleteMany({ _id: { $in: createdCategories.map(c => c._id) } });
        console.log('Cleanup completed');

        console.log('\nAll reporting system tests completed successfully!');

    } catch (error) {
        console.error('Error during testing:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

// Run the tests
testReportingSystem(); 