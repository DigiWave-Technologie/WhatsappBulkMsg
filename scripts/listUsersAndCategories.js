const mongoose = require('mongoose');
const User = require('../models/User');
const Category = require('../models/Category');
require('dotenv').config();

async function listUsersAndCategories() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/whatsapp_bulk_campaign');
    console.log('Connected to MongoDB');

    const users = await User.find({}, 'username email role _id');
    const categories = await Category.find({}, 'name _id');

    console.log('\nUsers:');
    users.forEach(u => {
      console.log(`- ${u.username} (${u.role}): ${u._id}`);
    });

    console.log('\nCategories:');
    categories.forEach(c => {
      console.log(`- ${c.name}: ${c._id}`);
    });

    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

listUsersAndCategories(); 