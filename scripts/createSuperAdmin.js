const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const readline = require('readline');
require('dotenv').config();

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to get user input
const question = (query) => new Promise((resolve) => rl.question(query, resolve));

const createSuperAdmin = async () => {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected successfully');

    // Check if super admin already exists
    const existingSuperAdmin = await User.findOne({ role: 'super_admin' });
    if (existingSuperAdmin) {
      console.log('\nA super admin already exists in the database.');
      const answer = await question('Do you want to replace it? (yes/no): ');
      
      if (answer.toLowerCase() !== 'yes') {
        console.log('Operation cancelled. Existing super admin was not modified.');
        await mongoose.disconnect();
        rl.close();
        process.exit(0);
      }
      
      // Delete existing super admin
      await User.deleteOne({ role: 'super_admin' });
      console.log('Existing super admin removed.');
    }

    // Get super admin details from user
    console.log('\nPlease provide the following details for the super admin:');
    
    const firstName = await question('First Name: ');
    const lastName = await question('Last Name: ');
    const email = await question('Email: ');
    const mobileNumber = await question('Mobile Number: ');
    const password = await question('Password: ');
    
    // Validate inputs
    if (!firstName || !lastName || !email || !mobileNumber || !password) {
      throw new Error('All fields are required');
    }
    
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }
    
    // Check if email is already in use
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error('Email is already in use');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create super admin
    const superAdmin = new User({
      firstName,
      lastName,
      email,
      mobileNumber,
      password: hashedPassword,
      role: 'super_admin',
      canCreateUsers: true,
      isActive: true
    });

    await superAdmin.save();
    
    console.log('\nSuper admin created successfully!');
    console.log('--------------------------------');
    console.log('Name:', `${firstName} ${lastName}`);
    console.log('Email:', email);
    console.log('Mobile:', mobileNumber);
    console.log('Role: super_admin');
    console.log('--------------------------------');
    console.log('Please save these credentials securely.');
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    rl.close();
    process.exit(0);
  } catch (error) {
    console.error('\nError:', error.message);
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
    rl.close();
    process.exit(1);
  }
};

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\nOperation cancelled by user');
  if (mongoose.connection.readyState === 1) {
    await mongoose.disconnect();
  }
  rl.close();
  process.exit(0);
});

createSuperAdmin(); 