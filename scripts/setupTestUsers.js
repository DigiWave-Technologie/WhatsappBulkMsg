const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

// Test users configuration with credentials from the existing script
const testUsers = [
  // Super Admins
  {
    username: 'superadmin1',
    email: 'superadmin1@test.com',
    password: 'SuperAdmin@123',
    firstName: 'Super',
    lastName: 'Admin One',
    mobileNumber: '+1234567890',
    role: 'super_admin',
    requirePasswordChange: false,
    permissions: {
      virtual: true,
      personal: true,
      internationalPersonal: true,
      internationalVirtual: true
    },
    rolePermissions: {
      canCreateUsers: true,
      canUpdateUsers: true,
      canDeleteUsers: true,
      canViewAllUsers: true,
      canManageAdmins: true,
      canManageResellers: true,
      canManageUsers: true,
      canViewAnalytics: true,
      canManageSettings: true,
      canManagePricingPlans: true,
      canViewSystemStats: true,
      canManageAllCampaigns: true,
      canManageAllReports: true,
      canManageAllGroups: true,
      canManageAllTemplates: true,
      canManageAllCredits: true,
      canManageAllAPIKeys: true,
      hasUnlimitedCredits: true
    }
  },
  // Admins
  {
    username: 'admin1',
    email: 'admin1@test.com',
    password: 'AdminUser@123',
    firstName: 'Admin',
    lastName: 'User One',
    mobileNumber: '+1234567891',
    role: 'admin',
    requirePasswordChange: false,
    permissions: {
      virtual: true,
      personal: true,
      internationalPersonal: true,
      internationalVirtual: false
    },
    rolePermissions: {
      canCreateUsers: true,
      canUpdateUsers: true,
      canDeleteUsers: true,
      canViewAllUsers: true,
      canManageResellers: true,
      canManageUsers: true,
      canViewAnalytics: true,
      canManageSettings: false,
      canManagePricingPlans: false,
      canViewSystemStats: true,
      canManageAllCampaigns: true,
      canManageAllReports: true,
      canManageAllGroups: true,
      canManageAllTemplates: true,
      canManageAllCredits: true,
      canManageAllAPIKeys: false
    }
  },
  // Resellers
  {
    username: 'reseller1',
    email: 'reseller1@test.com',
    password: 'Reseller@123',
    firstName: 'Reseller',
    lastName: 'User One',
    mobileNumber: '+1234567892',
    role: 'reseller',
    requirePasswordChange: false,
    permissions: {
      virtual: true,
      personal: true,
      internationalPersonal: false,
      internationalVirtual: false
    },
    rolePermissions: {
      canCreateUsers: true,
      canUpdateUsers: true,
      canDeleteUsers: false,
      canViewAllUsers: false,
      canManageUsers: true,
      canViewAnalytics: true,
      canManageAllCampaigns: true,
      canManageAllReports: true,
      canManageAllGroups: true,
      canManageAllTemplates: true,
      canManageAllCredits: true
    }
  },
  // Users
  {
    username: 'user1',
    email: 'user1@test.com',
    password: 'TestUser@123',
    firstName: 'Test',
    lastName: 'User One',
    mobileNumber: '+1234567893',
    role: 'user',
    requirePasswordChange: false,
    permissions: {
      virtual: true,
      personal: false,
      internationalPersonal: false,
      internationalVirtual: false
    },
    rolePermissions: {
      canViewAnalytics: true,
      canManageAllCampaigns: true,
      canManageAllReports: true,
      canManageAllGroups: true,
      canManageAllTemplates: true
    }
  },
  {
    username: 'user2',
    email: 'user2@test.com',
    password: 'TestUser@123',
    firstName: 'Test',
    lastName: 'User Two',
    mobileNumber: '+1234567894',
    role: 'user',
    requirePasswordChange: false,
    permissions: {
      virtual: false,
      personal: true,
      internationalPersonal: false,
      internationalVirtual: false
    },
    rolePermissions: {
      canViewAnalytics: true,
      canManageAllCampaigns: true,
      canManageAllReports: true,
      canManageAllGroups: true,
      canManageAllTemplates: true
    }
  }
];

async function setupTestUsers() {
  try {
    // Connect to MongoDB using the same configuration as the main app
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/whatsapp-bulk-message';
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      family: 4 // Force IPv4
    });
    console.log('Connected to MongoDB');

    // Create users in order of hierarchy
    const createdUsers = [];
    
    // First create super admins
    for (const user of testUsers.filter(u => u.role === 'super_admin')) {
      await User.findOneAndDelete({ username: user.username });
      const newUser = new User({
        ...user,
        isActive: true
      });
      await newUser.save();
      createdUsers.push(newUser);
      console.log(`✅ Created Super Admin: ${user.username}`);
    }

    // Then create admins
    for (const user of testUsers.filter(u => u.role === 'admin')) {
      await User.findOneAndDelete({ username: user.username });
      const newUser = new User({
        ...user,
        isActive: true,
        createdBy: createdUsers[0]._id // Set first super admin as creator
      });
      await newUser.save();
      createdUsers.push(newUser);
      console.log(`✅ Created Admin: ${user.username}`);
    }

    // Then create resellers
    for (const user of testUsers.filter(u => u.role === 'reseller')) {
      await User.findOneAndDelete({ username: user.username });
      const newUser = new User({
        ...user,
        isActive: true,
        createdBy: createdUsers[1]._id // Set first admin as creator
      });
      await newUser.save();
      createdUsers.push(newUser);
      console.log(`✅ Created Reseller: ${user.username}`);
    }

    // Finally create users
    for (const user of testUsers.filter(u => u.role === 'user')) {
      await User.findOneAndDelete({ username: user.username });
      const newUser = new User({
        ...user,
        isActive: true,
        createdBy: createdUsers[2]._id // Set first reseller as creator
      });
      await newUser.save();
      createdUsers.push(newUser);
      console.log(`✅ Created User: ${user.username}`);
    }

    // Print all created users with their credentials
    console.log('\n🎯 TEST USERS CREATED SUCCESSFULLY!');
    console.log('=====================================');
    testUsers.forEach(user => {
      console.log(`\n📋 Role: ${user.role.toUpperCase()}`);
      console.log(`👤 Username: ${user.username}`);
      console.log(`🔑 Password: ${user.password}`);
      console.log(`📧 Email: ${user.email}`);
      console.log(`📱 Mobile: ${user.mobileNumber}`);
      console.log('-------------------');
    });

    console.log('\n🚀 Ready for testing! Use these credentials in Postman.');
    
  } catch (error) {
    console.error('❌ Error creating test users:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the script
if (require.main === module) {
  setupTestUsers();
}

module.exports = { testUsers, setupTestUsers };
