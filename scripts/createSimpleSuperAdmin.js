const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const createSimpleSuperAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected successfully');

    // Remove any existing super admin
    await User.deleteMany({ role: 'super_admin' });
    console.log('Removed any existing super admin');

    // Create super admin with hardcoded values
    const superAdmin = new User({
      username: 'superadmin',
      firstName: 'Super',
      lastName: 'Admin',
      email: 'admin@example.com',
      password: 'Admin@123', // This will be hashed by the pre-save hook
      mobileNumber: '1234567890',
      role: 'super_admin',
      canCreateUsers: true,
      isActive: true
    });

    await superAdmin.save();
    console.log('Super admin created successfully');
    console.log('Username: superadmin');
    console.log('Email: admin@example.com');
    console.log('Password: Admin@123');
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error creating super admin:', error);
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
};

createSimpleSuperAdmin(); 