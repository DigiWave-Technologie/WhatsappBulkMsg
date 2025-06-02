const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function verifyUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://127.0.0.1:27017/whatsapp_bulk_campaign', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Get the users collection
    const users = mongoose.connection.collection('users');
    
    // Find all users
    const allUsers = await users.find({}).toArray();
    console.log('\nAll users in database:');
    allUsers.forEach(user => {
      console.log(`\nUsername: ${user.username}`);
      console.log(`Role: ${user.role}`);
      console.log(`Password hash: ${user.password}`);
      console.log(`Require password change: ${user.requirePasswordChange}`);
      console.log('-------------------');
    });

    // Test password comparison
    const testPassword = 'SuperAdmin@123';
    console.log(`\nTesting password comparison with: ${testPassword}`);
    
    for (const user of allUsers) {
      const isMatch = await bcrypt.compare(testPassword, user.password);
      console.log(`\nUsername: ${user.username}`);
      console.log(`Password match: ${isMatch}`);
      console.log('-------------------');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

verifyUsers(); 