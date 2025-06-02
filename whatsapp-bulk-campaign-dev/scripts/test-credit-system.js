const mongoose = require('mongoose');
const User = require('../models/User');
const { Credit, CreditTransaction } = require('../models/Credit');
const Category = require('../models/Category');
const creditService = require('../services/creditsService');

// Test data
const testUsers = {
  superAdmin: {
    username: 'superadmin',
    email: 'superadmin@test.com',
    role: 'super_admin',
    password: 'test123',
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
  admin: {
    username: 'admin',
    email: 'admin@test.com',
    role: 'admin',
    password: 'test123',
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
  reseller: {
    username: 'reseller',
    email: 'reseller@test.com',
    role: 'reseller',
    password: 'test123',
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
  user: {
    username: 'user',
    email: 'user@test.com',
    role: 'user',
    password: 'test123',
    rolePermissions: {
      canViewAnalytics: true,
      canManageAllCampaigns: true,
      canManageAllReports: true,
      canManageAllGroups: true,
      canManageAllTemplates: true
    }
  }
};

async function setupTestData() {
  try {
    // Connect to database with more reliable configuration
    await mongoose.connect('mongodb://127.0.0.1:27017/whatsapp-bulk', {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,
      directConnection: true
    });

    console.log('Connected to MongoDB successfully');

    // Clear existing data
    await User.deleteMany({});
    await Credit.deleteMany({});
    await CreditTransaction.deleteMany({});
    await Category.deleteMany({});

    console.log('Cleared existing data');

    // Create test users in order of hierarchy
    const createdUsers = {};
    
    // First create super admin
    const superAdmin = new User(testUsers.superAdmin);
    await superAdmin.save();
    createdUsers.superAdmin = superAdmin;

    console.log('Created Super Admin');

    // Then create admin with super admin as creator
    const admin = new User({
      ...testUsers.admin,
      createdBy: superAdmin._id
    });
    await admin.save();
    createdUsers.admin = admin;

    console.log('Created Admin');

    // Then create reseller with admin as creator
    const reseller = new User({
      ...testUsers.reseller,
      createdBy: admin._id
    });
    await reseller.save();
    createdUsers.reseller = reseller;

    console.log('Created Reseller');

    // Finally create user with reseller as creator
    const user = new User({
      ...testUsers.user,
      createdBy: reseller._id
    });
    await user.save();
    createdUsers.user = user;

    console.log('Created User');

    // Set up parent-child relationships
    createdUsers.admin.parentId = createdUsers.superAdmin._id;
    createdUsers.reseller.parentId = createdUsers.admin._id;
    createdUsers.user.parentId = createdUsers.reseller._id;

    await Promise.all(Object.values(createdUsers).map(user => user.save()));

    console.log('Set up parent-child relationships');

    // Create a test category
    const category = new Category({
      name: 'Test Category',
      description: 'Test category for credit system',
      creditCost: 1,
      createdBy: superAdmin._id
    });
    await category.save();

    console.log('Created test category');

    // Create initial credits for super admin
    const superAdminCredit = new Credit({
      userId: superAdmin._id,
      categoryId: category._id,
      credit: Number.MAX_SAFE_INTEGER,
      isUnlimited: true
    });
    await superAdminCredit.save();

    console.log('Created super admin credits');

    return { users: createdUsers, category };
  } catch (error) {
    console.error('Error in setupTestData:', error);
    throw error;
  }
}

async function testCreditSystem() {
  try {
    console.log('Setting up test data...');
    const { users, category } = await setupTestData();

    // Test 1: Super Admin has unlimited credits
    console.log('\nTest 1: Super Admin has unlimited credits');
    const superAdminCredits = await creditService.getUserCreditBalance(users.superAdmin._id);
    console.log('Super Admin Credits:', superAdminCredits);

    // Test 2: Credit transfer from Super Admin to Admin
    console.log('\nTest 2: Credit transfer from Super Admin to Admin');
    const transfer1 = await creditService.transferCredits(
      users.superAdmin._id,
      users.admin._id,
      category._id,
      1000,
      'Initial credit transfer'
    );
    console.log('Transfer Result:', transfer1);

    // Test 3: Credit transfer from Admin to Reseller
    console.log('\nTest 3: Credit transfer from Admin to Reseller');
    const transfer2 = await creditService.transferCredits(
      users.admin._id,
      users.reseller._id,
      category._id,
      500,
      'Admin to Reseller transfer'
    );
    console.log('Transfer Result:', transfer2);

    // Test 4: Credit transfer from Reseller to User
    console.log('\nTest 4: Credit transfer from Reseller to User');
    const transfer3 = await creditService.transferCredits(
      users.reseller._id,
      users.user._id,
      category._id,
      100,
      'Reseller to User transfer'
    );
    console.log('Transfer Result:', transfer3);

    // Test 5: Try invalid transfer (User to Reseller)
    console.log('\nTest 5: Try invalid transfer (User to Reseller)');
    try {
      await creditService.transferCredits(
        users.user._id,
        users.reseller._id,
        category._id,
        50,
        'Invalid transfer'
      );
    } catch (error) {
      console.log('Expected Error:', error.message);
    }

    // Test 6: Debit credits from User
    console.log('\nTest 6: Debit credits from User');
    const debit = await creditService.debitCredits(
      users.user._id,
      category._id,
      10,
      new mongoose.Types.ObjectId() // Mock campaign ID
    );
    console.log('Debit Result:', debit);

    // Test 7: Get credit transactions for Super Admin
    console.log('\nTest 7: Get credit transactions for Super Admin');
    const superAdminTransactions = await creditService.getCreditTransactions(users.superAdmin._id);
    console.log('Super Admin Transactions:', superAdminTransactions);

    // Test 8: Get credit usage statistics for User
    console.log('\nTest 8: Get credit usage statistics for User');
    const userStats = await creditService.getCreditUsageStats(users.user._id);
    console.log('User Credit Stats:', userStats);

    console.log('\nAll tests completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Run the tests
testCreditSystem(); 