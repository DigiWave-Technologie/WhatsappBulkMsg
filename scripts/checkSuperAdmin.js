const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const checkSuperAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected successfully');

    // Find super admin
    const superAdmin = await User.findOne({ role: 'super_admin' });
    
    if (superAdmin) {
      console.log('Super admin found:');
      console.log('ID:', superAdmin._id);
      console.log('Name:', `${superAdmin.firstName} ${superAdmin.lastName}`);
      console.log('Email:', superAdmin.email);
      console.log('Mobile:', superAdmin.mobileNumber);
      console.log('Role:', superAdmin.role);
      console.log('Is Active:', superAdmin.isActive);
      console.log('Created At:', superAdmin.createdAt);
    } else {
      console.log('No super admin found in the database.');
    }
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error checking super admin:', error);
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
};

checkSuperAdmin(); 