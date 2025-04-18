const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const checkAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected successfully');

    // Find admin user
    const admin = await User.findOne({ email: 'testadmin@example.com' });
    
    if (admin) {
      console.log('Admin user found:');
      console.log('ID:', admin._id);
      console.log('Name:', `${admin.firstName} ${admin.lastName}`);
      console.log('Email:', admin.email);
      console.log('Mobile:', admin.mobileNumber);
      console.log('Role:', admin.role);
      console.log('Can Create Users:', admin.canCreateUsers);
      console.log('Is Active:', admin.isActive);
      console.log('Created At:', admin.createdAt);
    } else {
      console.log('No admin user found with email testadmin@example.com');
    }
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error checking admin user:', error);
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
};

checkAdmin(); 