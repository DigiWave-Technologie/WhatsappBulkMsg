const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Test users configuration
const testUsers = [
  // Super Admins
  {
    username: 'superadmin1',
    email: 'superadmin1@test.com',
    password: 'SuperAdmin@123',
    role: 'super_admin',
    requirePasswordChange: false,
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
  {
    username: 'superadmin2',
    email: 'superadmin2@test.com',
    password: 'SuperAdmin@123',
    role: 'super_admin',
    requirePasswordChange: false,
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
    role: 'admin',
    requirePasswordChange: true,
    rolePermissions: {
      canCreateUsers: true,
      canUpdateUsers: true,
      canDeleteUsers: true,
      canViewAllUsers: true,
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
      canManageAllAPIKeys: true
    }
  },
  {
    username: 'admin2',
    email: 'admin2@test.com',
    password: 'AdminUser@123',
    role: 'admin',
    requirePasswordChange: true,
    rolePermissions: {
      canCreateUsers: true,
      canUpdateUsers: true,
      canDeleteUsers: true,
      canViewAllUsers: true,
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
      canManageAllAPIKeys: true
    }
  },
  // Resellers
  {
    username: 'reseller1',
    email: 'reseller1@test.com',
    password: 'Reseller@123',
    role: 'reseller',
    requirePasswordChange: true,
    rolePermissions: {
      canCreateUsers: true,
      canUpdateUsers: true,
      canDeleteUsers: true,
      canViewAllUsers: true,
      canManageUsers: true,
      canViewAnalytics: true,
      canManageAllCampaigns: true,
      canManageAllReports: true,
      canManageAllGroups: true,
      canManageAllTemplates: true,
      canManageAllCredits: true
    }
  },
  {
    username: 'reseller2',
    email: 'reseller2@test.com',
    password: 'Reseller@123',
    role: 'reseller',
    requirePasswordChange: true,
    rolePermissions: {
      canCreateUsers: true,
      canUpdateUsers: true,
      canDeleteUsers: true,
      canViewAllUsers: true,
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
    role: 'user',
    requirePasswordChange: true,
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
    role: 'user',
    requirePasswordChange: true,
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
    // Connect to MongoDB
    await mongoose.connect('mongodb://127.0.0.1:27017/whatsapp_bulk_campaign', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Create users in order of hierarchy
    const createdUsers = [];
    
    // First create super admins
    for (const user of testUsers.filter(u => u.role === 'super_admin')) {
      await User.findOneAndDelete({ username: user.username });
      const newUser = new User({
        ...user,
        status: 'active'
      });
      await newUser.save();
      createdUsers.push(newUser);
      console.log(`Created Super Admin: ${user.username}`);
    }

    // Then create admins
    for (const user of testUsers.filter(u => u.role === 'admin')) {
      await User.findOneAndDelete({ username: user.username });
      const newUser = new User({
        ...user,
        status: 'active',
        createdBy: createdUsers[0]._id // Set first super admin as creator
      });
      await newUser.save();
      createdUsers.push(newUser);
      console.log(`Created Admin: ${user.username}`);
    }

    // Then create resellers
    for (const user of testUsers.filter(u => u.role === 'reseller')) {
      await User.findOneAndDelete({ username: user.username });
      const newUser = new User({
        ...user,
        status: 'active',
        createdBy: createdUsers[2]._id // Set first admin as creator
      });
      await newUser.save();
      createdUsers.push(newUser);
      console.log(`Created Reseller: ${user.username}`);
    }

    // Finally create users
    for (const user of testUsers.filter(u => u.role === 'user')) {
      await User.findOneAndDelete({ username: user.username });
      const newUser = new User({
        ...user,
        status: 'active',
        createdBy: createdUsers[4]._id // Set first reseller as creator
      });
      await newUser.save();
      createdUsers.push(newUser);
      console.log(`Created User: ${user.username}`);
    }

    // Print all created users with their credentials
    console.log('\nTest Users Created:');
    console.log('===================');
    testUsers.forEach(user => {
      console.log(`\nRole: ${user.role}`);
      console.log(`Username: ${user.username}`);
      console.log(`Password: ${user.password}`);
      console.log(`Email: ${user.email}`);
      console.log(`Require Password Change: ${user.requirePasswordChange}`);
      console.log('-------------------');
    });

    console.log('\nAll test users created successfully!');
  } catch (error) {
    console.error('Error creating test users:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
setupTestUsers(); 