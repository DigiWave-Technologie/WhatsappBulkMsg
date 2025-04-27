require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function createTestAdmin() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Check if super admin already exists
        const existingAdmin = await User.findOne({ username: 'superadmin' });
        if (existingAdmin) {
            console.log('Super admin already exists');
            return;
        }

        // Create super admin user
        const superAdmin = new User({
            username: 'superadmin',
            password: 'Super@admin123',
            firstName: 'Super',
            lastName: 'Admin',
            mobileNumber: '1234567890',
            role: 'super_admin',
            isActive: true,
            canCreateUsers: true
        });

        await superAdmin.save();
        console.log('Super admin created successfully');
        console.log('Username:', superAdmin.username);
        console.log('Role:', superAdmin.role);

    } catch (error) {
        console.error('Error creating super admin:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

createTestAdmin(); 