const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const { Credit } = require('../models/Credit');
require('dotenv').config();

async function setupTestUsers() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Drop userName index if exists to avoid case sensitivity issues
        try {
            await User.collection.dropIndex('userName_1');
            console.log('Dropped userName index');
        } catch (error) {
            console.log('No userName index to drop');
        }

        // Hash passwords
        const saltRounds = 10;
        const systemPassword = await bcrypt.hash('system123', saltRounds);
        const adminPassword = await bcrypt.hash('admin123', saltRounds);
        const userPassword = await bcrypt.hash('user123', saltRounds);

        // Create or update system user
        const systemUser = await User.findOneAndUpdate(
            { username: 'system' },
            {
                $setOnInsert: {
                    email: 'system@test.com',
                    password: systemPassword,
                    role: 'system',
                    isActive: true
                }
            },
            { upsert: true, new: true }
        );
        console.log('System user:', systemUser);

        // Create or update admin user
        const adminUser = await User.findOneAndUpdate(
            { username: 'admin' },
            {
                $setOnInsert: {
                    email: 'admin@test.com',
                    password: adminPassword,
                    role: 'admin',
                    isActive: true,
                    createdBy: systemUser._id
                }
            },
            { upsert: true, new: true }
        );
        console.log('Admin user:', adminUser);

        // Create or update regular user
        const regularUser = await User.findOneAndUpdate(
            { username: 'user' },
            {
                $setOnInsert: {
                    email: 'user@test.com',
                    password: userPassword,
                    role: 'user',
                    isActive: true,
                    createdBy: adminUser._id
                }
            },
            { upsert: true, new: true }
        );
        console.log('Regular user:', regularUser);

        console.log('Test users setup completed successfully');

        // Add credits to admin user
        await Credit.create({
            userId: adminUser._id,
            credit: 1000,
            categoryId: new mongoose.Types.ObjectId(),
            isUnlimited: false
        });
        console.log('Added credits to admin user');

        // Add credits to regular user
        await Credit.create({
            userId: regularUser._id,
            credit: 100,
            categoryId: new mongoose.Types.ObjectId(),
            isUnlimited: false
        });
        console.log('Added credits to regular user');

    } catch (error) {
        console.error('Error setting up test users:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

setupTestUsers(); 