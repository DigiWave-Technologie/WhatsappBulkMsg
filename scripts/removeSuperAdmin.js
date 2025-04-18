const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const removeSuperAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected successfully');

    // Find and remove super admin
    const result = await User.deleteOne({ role: 'super_admin' });
    
    if (result.deletedCount > 0) {
      console.log('Super admin removed successfully');
    } else {
      console.log('No super admin found to remove');
    }
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error removing super admin:', error);
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
};

removeSuperAdmin(); 