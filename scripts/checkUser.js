const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function checkUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const user = await User.findOne({ username: 'system' });
    if (user) {
      console.log('Found system user:', {
        username: user.username,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      });
    } else {
      console.log('System user not found');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

checkUser(); 