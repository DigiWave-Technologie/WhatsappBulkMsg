const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function listUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const users = await User.find().lean();
    console.log('Users in database:');
    users.forEach(user => {
      console.log(`Username: ${user.username}`);
      console.log(`Email: ${user.email}`);
      console.log(`Role: ${user.role}`);
      console.log('-------------------');
    });

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

listUsers(); 