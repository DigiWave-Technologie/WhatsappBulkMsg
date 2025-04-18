const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const resetSuperAdminPassword = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected successfully');

    // Find super admin
    const superAdmin = await User.findOne({ role: 'super_admin' });
    
    if (!superAdmin) {
      console.log('No super admin found in the database.');
      await mongoose.disconnect();
      process.exit(1);
    }
    
    // Reset password
    superAdmin.password = 'Super@admin';
    await superAdmin.save();
    
    console.log('Super admin password reset successfully');
    console.log('Email:', superAdmin.email);
    console.log('New Password: Super@admin');
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error resetting super admin password:', error);
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
};

resetSuperAdminPassword(); 