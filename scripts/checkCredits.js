const mongoose = require('mongoose');
const { Credit } = require('../models/Credit');
const { CreditTransaction } = require('../models/Credit');
const User = require('../models/User');
require('dotenv').config();

async function checkCredits() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Find all credits
        const credits = await Credit.find().lean();
        console.log('All credits:', JSON.stringify(credits, null, 2));

        // Get user information for all credits
        const userIds = credits.map(credit => credit.userId);
        const users = await User.find({ _id: { $in: userIds } }).lean();
        const userMap = {};
        users.forEach(user => {
            userMap[user._id.toString()] = {
                username: user.username,
                email: user.email,
                role: user.role
            };
        });

        // Add user information to credits
        const creditsWithUserInfo = credits.map(credit => {
            const userInfo = userMap[credit.userId.toString()] || { username: 'Unknown User' };
            return {
                ...credit,
                userInfo
            };
        });

        console.log('Credits with user information:');
        creditsWithUserInfo.forEach(credit => {
            console.log(`Credit ID: ${credit._id}`);
            console.log(`User ID: ${credit.userId}`);
            console.log(`Username: ${credit.userInfo.username}`);
            console.log(`Email: ${credit.userInfo.email || 'N/A'}`);
            console.log(`Role: ${credit.userInfo.role || 'N/A'}`);
            console.log(`Category ID: ${credit.categoryId}`);
            console.log(`Credit Amount: ${credit.credit}`);
            console.log(`Time Duration: ${credit.timeDuration || 'unlimited'}`);
            console.log(`Expiry Date: ${credit.expiryDate || 'N/A'}`);
            console.log('-----------------------------------');
        });

        // Check for expired credits
        const now = new Date();
        const expiredCredits = await Credit.find({
            expiryDate: { $lt: now },
            timeDuration: { $ne: 'unlimited' }
        }).lean();
        
        console.log('Expired credits:', JSON.stringify(expiredCredits, null, 2));
        
        // Process expired credits
        for (const credit of expiredCredits) {
            // Get user information
            const user = await User.findById(credit.userId).lean();
            const userInfo = user ? {
                username: user.username,
                email: user.email,
                role: user.role
            } : { username: 'Unknown User' };
            
            console.log(`Processing expired credit for user: ${userInfo.username} (ID: ${credit.userId})`);
            
            // Create transaction record for expired credits
            await CreditTransaction.create({
                fromUserId: credit.userId,
                toUserId: credit.userId, // Same user for expiry
                categoryId: credit.categoryId,
                credit: credit.credit,
                creditType: 'expiry',
                description: `Credits expired due to ${credit.timeDuration} duration`
            });
            
            // Reset credit to 0
            await Credit.findByIdAndUpdate(credit._id, {
                $set: {
                    credit: 0,
                    expiryDate: null,
                    timeDuration: 'unlimited'
                }
            });
            
            console.log(`Processed expired credit for user ${userInfo.username} (ID: ${credit.userId})`);
        }
        
        console.log(`Processed ${expiredCredits.length} expired credits`);

        // Check for credits that will expire soon (within 24 hours)
        const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const expiringSoonCredits = await Credit.find({
            expiryDate: { 
                $gt: now,
                $lt: oneDayFromNow 
            },
            timeDuration: { $ne: 'unlimited' }
        }).lean();
        
        console.log('Credits expiring soon (within 24 hours):');
        for (const credit of expiringSoonCredits) {
            const user = await User.findById(credit.userId).lean();
            const userInfo = user ? {
                username: user.username,
                email: user.email,
                role: user.role
            } : { username: 'Unknown User' };
            
            console.log(`Credit ID: ${credit._id}`);
            console.log(`User ID: ${credit.userId}`);
            console.log(`Username: ${userInfo.username}`);
            console.log(`Email: ${userInfo.email || 'N/A'}`);
            console.log(`Role: ${userInfo.role || 'N/A'}`);
            console.log(`Category ID: ${credit.categoryId}`);
            console.log(`Credit Amount: ${credit.credit}`);
            console.log(`Time Duration: ${credit.timeDuration}`);
            console.log(`Expiry Date: ${credit.expiryDate}`);
            console.log('-----------------------------------');
        }
        
        // Check for credits with custom durations
        const customDurationCredits = await Credit.find({
            timeDuration: { $in: ['custom', 'specific_date'] }
        }).lean();
        
        console.log('Credits with custom durations:');
        for (const credit of customDurationCredits) {
            const user = await User.findById(credit.userId).lean();
            const userInfo = user ? {
                username: user.username,
                email: user.email,
                role: user.role
            } : { username: 'Unknown User' };
            
            console.log(`Credit ID: ${credit._id}`);
            console.log(`User ID: ${credit.userId}`);
            console.log(`Username: ${userInfo.username}`);
            console.log(`Email: ${userInfo.email || 'N/A'}`);
            console.log(`Role: ${userInfo.role || 'N/A'}`);
            console.log(`Category ID: ${credit.categoryId}`);
            console.log(`Credit Amount: ${credit.credit}`);
            console.log(`Time Duration: ${credit.timeDuration}`);
            console.log(`Expiry Date: ${credit.expiryDate}`);
            console.log('-----------------------------------');
        }

        // Get recent credit transactions
        const recentTransactions = await CreditTransaction.find()
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();
        
        console.log('Recent credit transactions:');
        for (const transaction of recentTransactions) {
            const fromUser = await User.findById(transaction.fromUserId).lean();
            const toUser = await User.findById(transaction.toUserId).lean();
            
            const fromUserInfo = fromUser ? {
                username: fromUser.username,
                email: fromUser.email,
                role: fromUser.role
            } : { username: 'Unknown User' };
            
            const toUserInfo = toUser ? {
                username: toUser.username,
                email: toUser.email,
                role: toUser.role
            } : { username: 'Unknown User' };
            
            console.log(`Transaction ID: ${transaction._id}`);
            console.log(`From User ID: ${transaction.fromUserId}`);
            console.log(`From Username: ${fromUserInfo.username}`);
            console.log(`To User ID: ${transaction.toUserId}`);
            console.log(`To Username: ${toUserInfo.username}`);
            console.log(`Category ID: ${transaction.categoryId}`);
            console.log(`Credit Amount: ${transaction.credit}`);
            console.log(`Credit Type: ${transaction.creditType}`);
            console.log(`Description: ${transaction.description || 'N/A'}`);
            console.log(`Created At: ${transaction.createdAt}`);
            console.log('-----------------------------------');
        }

    } catch (error) {
        console.error('Error checking credits:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

checkCredits(); 