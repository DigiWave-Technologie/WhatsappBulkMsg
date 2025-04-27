const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');
require('dotenv').config();

async function createSuperAdmin() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Hash password
        const saltRounds = 10;
        const password = await bcrypt.hash('superadmin123', saltRounds);

        // Create or update superadmin user
        const superAdmin = await User.findOneAndUpdate(
            { username: 'superadmin' },
            {
                username: 'superadmin',
                email: 'superadmin@test.com',
                password: password,
                role: 'super_admin',
                isActive: true,
                canCreateUsers: true
            },
            { upsert: true, new: true }
        );

        console.log('Superadmin user created:', {
            username: superAdmin.username,
            email: superAdmin.email,
            role: superAdmin.role,
            isActive: superAdmin.isActive
        });

    } catch (error) {
        console.error('Error creating superadmin:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

createSuperAdmin(); 