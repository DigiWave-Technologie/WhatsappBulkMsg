const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function createTestUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // First create a super admin
    const superAdmin = new User({
      username: 'superadmin',
      password: 'admin123',
      email: 'admin@example.com',
      role: 'super_admin',
      isActive: true
    });

    await superAdmin.save();
    console.log('Super admin created successfully');
    console.log('Username: superadmin');
    console.log('Password: admin123');

    // Then create a test user
    const testUser = new User({
      username: 'testuser',
      password: 'testpass123',
      email: 'test@example.com',
      role: 'admin',
      isActive: true,
      createdBy: superAdmin._id
    });

    await testUser.save();
    console.log('Test user created successfully');
    console.log('Username: testuser');
    console.log('Password: testpass123');

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createTestUser(); 