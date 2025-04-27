const mongoose = require('mongoose');
const Category = require('../models/Category');
const { Credit } = require('../models/Credit');
const User = require('../models/User');
require('dotenv').config();

async function setupCredits() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get or create default category
    let defaultCategory = await Category.findOne({ name: 'Default' });
    if (!defaultCategory) {
      defaultCategory = await Category.create({
        name: 'Default',
        description: 'Default credit category for general usage',
        creditCost: 1,
        isActive: true
      });
      console.log('Created default category:', defaultCategory);
    } else {
      console.log('Using existing default category:', defaultCategory);
    }

    // Get system user
    const systemUser = await User.findOne({ username: 'system' });
    if (!systemUser) {
      throw new Error('System user not found');
    }

    // Get admin user
    const adminUser = await User.findOne({ username: 'admin' });
    if (!adminUser) {
      throw new Error('Admin user not found');
    }

    // Get regular user
    const regularUser = await User.findOne({ username: 'user' });
    if (!regularUser) {
      throw new Error('Regular user not found');
    }

    // Add credits to system user
    const systemCredit = await Credit.findOneAndUpdate(
      { userId: systemUser._id, categoryId: defaultCategory._id },
      { 
        $setOnInsert: { credit: 10000, isUnlimited: false },
        $set: { lastUsed: new Date() }
      },
      { upsert: true, new: true }
    );
    console.log('Updated system user credits:', systemCredit);

    // Add credits to admin user
    const adminCredit = await Credit.findOneAndUpdate(
      { userId: adminUser._id, categoryId: defaultCategory._id },
      { 
        $setOnInsert: { credit: 1000, isUnlimited: false },
        $set: { lastUsed: new Date() }
      },
      { upsert: true, new: true }
    );
    console.log('Updated admin user credits:', adminCredit);

    // Add credits to regular user
    const regularCredit = await Credit.findOneAndUpdate(
      { userId: regularUser._id, categoryId: defaultCategory._id },
      { 
        $setOnInsert: { credit: 100, isUnlimited: false },
        $set: { lastUsed: new Date() }
      },
      { upsert: true, new: true }
    );
    console.log('Updated regular user credits:', regularCredit);

    console.log('Credit setup completed successfully');

  } catch (error) {
    console.error('Error setting up credits:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

setupCredits(); 