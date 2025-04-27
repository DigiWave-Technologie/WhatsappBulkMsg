require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function updateAdminRole() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to MongoDB');

        // Find the user by email
        const email = 'testadmin@example.com'; // Updated to match the email from testCreateAdmin.js
        const user = await User.findOne({ email });

        if (!user) {
            console.log('User not found with email:', email);
            return;
        }

        // Update the role to 'admin'
        user.role = 'admin';
        await user.save();

        console.log('Admin role updated successfully');
        console.log('Updated user:', {
            email: user.email,
            role: user.role,
            firstName: user.firstName,
            lastName: user.lastName
        });

    } catch (error) {
        console.error('Error updating admin role:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

updateAdminRole(); 