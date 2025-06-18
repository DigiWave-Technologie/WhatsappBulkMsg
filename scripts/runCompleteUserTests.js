const { setupTestUsers } = require('./setupTestUsers');
const { runAllTests } = require('./testUserManagement');
const mongoose = require('mongoose');
require('dotenv').config();

async function runCompleteTestSuite() {
  console.log('🚀 STARTING COMPLETE USER MANAGEMENT TEST SUITE');
  console.log('================================================');
  
  try {
    // Step 1: Setup test users
    console.log('\n📋 STEP 1: Setting up test users...');
    await setupTestUsers();
    
    // Wait a moment for database operations to complete
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Step 2: Run all API tests
    console.log('\n🧪 STEP 2: Running API tests...');
    await runAllTests();
    
    console.log('\n✅ COMPLETE TEST SUITE FINISHED SUCCESSFULLY!');
    console.log('=============================================');
    
    // Print test summary
    printTestSummary();
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  }
}

function printTestSummary() {
  console.log('\n📊 TEST SUMMARY');
  console.log('================');
  console.log('✅ Test users created successfully');
  console.log('✅ Authentication tests completed');
  console.log('✅ User creation tests completed');
  console.log('✅ Permission tests completed');
  console.log('✅ Security features tested');
  console.log('✅ API key management tested');
  console.log('✅ Password management tested');
  
  console.log('\n🎯 NEXT STEPS FOR POSTMAN TESTING:');
  console.log('===================================');
  console.log('1. Start your server: npm start');
  console.log('2. Import the Postman collection: postman/UserManagementComplete.postman_collection.json');
  console.log('3. Import the environment: postman/UserManagementComplete.postman_environment.json');
  console.log('4. Run the collection in Postman');
  
  console.log('\n📋 TEST USER CREDENTIALS:');
  console.log('==========================');
  console.log('Super Admin: superadmin1 / SuperAdmin@123');
  console.log('Admin: admin1 / AdminUser@123');
  console.log('Reseller: reseller1 / Reseller@123');
  console.log('User: user1 / TestUser@123');
  console.log('User: user2 / TestUser@123');
  
  console.log('\n🔗 API ENDPOINTS TESTED:');
  console.log('=========================');
  console.log('Authentication:');
  console.log('  POST /api/auth/login');
  console.log('  POST /api/auth/logout');
  console.log('  POST /api/auth/change-password');
  
  console.log('\nUser Management:');
  console.log('  POST /api/auth/createUser');
  console.log('  GET  /api/auth/users');
  console.log('  PUT  /api/auth/update-user/:id');
  console.log('  DELETE /api/auth/delete-user/:id');
  
  console.log('\nSecurity Features:');
  console.log('  POST /api/auth/lock-account/:userId');
  console.log('  POST /api/auth/unlock-account/:userId');
  console.log('  POST /api/auth/force-password-reset/:userId');
  console.log('  GET  /api/auth/security-logs');
  console.log('  GET  /api/auth/security-audit/:userId');
  console.log('  GET  /api/auth/active-sessions');
  
  console.log('\nAPI Key Management:');
  console.log('  POST /api/auth/generate-api-key');
  console.log('  POST /api/auth/revoke-api-key');
  
  console.log('\nAdmin Features:');
  console.log('  POST /api/auth/admin/change-user-password/:userId');
  console.log('  GET  /api/auth/admin/user-credentials');
  
  console.log('\n🎉 ALL USER MANAGEMENT FEATURES TESTED!');
}

// Run the complete test suite
if (require.main === module) {
  runCompleteTestSuite();
}

module.exports = { runCompleteTestSuite };
