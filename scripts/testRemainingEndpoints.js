const axios = require('axios');
require('dotenv').config();

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Test credentials
const testCredentials = {
  superadmin: { username: 'superadmin1', password: 'SuperAdmin@123' },
  admin: { username: 'admin1', password: 'AdminUser@123' },
  reseller: { username: 'reseller1', password: 'Reseller@123' },
  user: { username: 'user2', password: 'TestUser@123' } // Using user2 since user1 was deleted
};

let tokens = {};
let userIds = {};

// Helper function to make API requests
async function makeRequest(method, endpoint, data = null, token = null, apiKey = null) {
  try {
    const headers = { 'Content-Type': 'application/json' };
    
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (apiKey) headers['X-API-Key'] = apiKey;

    const config = { method, url: `${BASE_URL}${endpoint}`, headers };
    if (data) config.data = data;

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status || 500
    };
  }
}

// Login all test users
async function loginAllUsers() {
  console.log('🔐 LOGGING IN ALL TEST USERS');
  console.log('=============================');

  for (const [role, creds] of Object.entries(testCredentials)) {
    console.log(`\n👤 Logging in ${role}: ${creds.username}`);
    
    const result = await makeRequest('POST', '/api/auth/login', creds);
    
    if (result.success) {
      const responseData = result.data.data || result.data;
      tokens[role] = responseData.token;
      userIds[role] = responseData.user?.id || responseData.user?.userId;
      console.log(`✅ Login successful - User ID: ${userIds[role]}`);
    } else {
      console.log(`❌ Login failed: ${result.error?.message || result.error}`);
    }
  }
}

// Test developer API endpoints
async function testDeveloperAPI() {
  console.log('\n🔧 TESTING DEVELOPER API ENDPOINTS');
  console.log('===================================');

  // First generate an API key
  const apiKeyResult = await makeRequest('POST', '/api/auth/generate-api-key', {}, tokens.superadmin);
  
  if (!apiKeyResult.success) {
    console.log('❌ Failed to generate API key for developer testing');
    return;
  }

  const apiKey = apiKeyResult.data.apiKey || apiKeyResult.data.data?.apiKey;
  console.log(`✅ Generated API key: ${apiKey?.substring(0, 20)}...`);

  const devTests = [
    {
      name: 'Create Developer User',
      method: 'POST',
      endpoint: '/api/developer/admin/users',
      data: {
        username: 'dev_api_user',
        password: 'DevAPI@123',
        email: 'devapi@test.com',
        firstName: 'Dev',
        lastName: 'API User',
        role: 'user'
      }
    },
    {
      name: 'Get Developer Users',
      method: 'GET',
      endpoint: '/api/developer/admin/users'
    },
    {
      name: 'Update Developer User',
      method: 'PUT',
      endpoint: '/api/developer/admin/users/{id}',
      data: { firstName: 'Updated Dev User' }
    },
    {
      name: 'Add Credits to Developer User',
      method: 'POST',
      endpoint: '/api/developer/admin/users/{id}/credits',
      data: { amount: 100, type: 'virtual_quick' }
    },
    {
      name: 'Delete Developer User',
      method: 'DELETE',
      endpoint: '/api/developer/admin/users/{id}'
    }
  ];

  let createdUserId = null;

  for (const test of devTests) {
    console.log(`\n🔗 Testing: ${test.name}`);
    
    let endpoint = test.endpoint;
    if (endpoint.includes('{id}') && createdUserId) {
      endpoint = endpoint.replace('{id}', createdUserId);
    }
    
    const result = await makeRequest(test.method, endpoint, test.data, null, apiKey);
    
    if (result.success) {
      console.log(`  ✅ Success: ${result.data?.message || 'OK'}`);
      
      // Store created user ID for subsequent tests
      if (test.name === 'Create Developer User' && result.data?.data?.userId) {
        createdUserId = result.data.data.userId;
        console.log(`  📝 Created user ID: ${createdUserId}`);
      }
    } else {
      console.log(`  ❌ Failed: ${result.error?.message || result.error}`);
    }
  }
}

// Test logout functionality
async function testLogout() {
  console.log('\n🚪 TESTING LOGOUT FUNCTIONALITY');
  console.log('================================');

  for (const [role, token] of Object.entries(tokens)) {
    console.log(`\n👤 Testing logout for ${role}`);
    
    const result = await makeRequest('POST', '/api/auth/logout', {}, token);
    
    if (result.success) {
      console.log(`  ✅ Success: ${result.data?.message || 'Logged out successfully'}`);
    } else {
      console.log(`  ❌ Failed: ${result.error?.message || result.error}`);
    }
  }
}

// Test error handling and edge cases
async function testErrorHandling() {
  console.log('\n⚠️ TESTING ERROR HANDLING');
  console.log('==========================');

  const errorTests = [
    {
      name: 'Invalid Token',
      test: () => makeRequest('GET', '/api/auth/users', null, 'invalid_token')
    },
    {
      name: 'Missing Authorization',
      test: () => makeRequest('GET', '/api/auth/users')
    },
    {
      name: 'Invalid User ID',
      test: () => makeRequest('GET', '/api/auth/security-audit/invalid_id', null, tokens.superadmin)
    },
    {
      name: 'Weak Password in User Creation',
      test: () => makeRequest('POST', '/api/auth/createUser', {
        username: 'weakpass_user',
        password: '123',
        email: 'weak@test.com',
        role: 'user'
      }, tokens.superadmin)
    },
    {
      name: 'Duplicate Username',
      test: () => makeRequest('POST', '/api/auth/createUser', {
        username: 'superadmin1',
        password: 'Test@123',
        email: 'duplicate@test.com',
        role: 'user'
      }, tokens.superadmin)
    },
    {
      name: 'Invalid Email Format',
      test: () => makeRequest('POST', '/api/auth/createUser', {
        username: 'invalid_email_user',
        password: 'Test@123',
        email: 'invalid-email',
        role: 'user'
      }, tokens.superadmin)
    },
    {
      name: 'Non-existent User Login',
      test: () => makeRequest('POST', '/api/auth/login', {
        username: 'nonexistent_user',
        password: 'password'
      })
    },
    {
      name: 'Wrong Password',
      test: () => makeRequest('POST', '/api/auth/login', {
        username: 'superadmin1',
        password: 'wrong_password'
      })
    }
  ];

  for (const errorTest of errorTests) {
    console.log(`\n🧪 Testing: ${errorTest.name}`);
    
    try {
      const result = await errorTest.test();
      
      if (!result.success) {
        console.log(`  ✅ Correctly handled error: ${result.error?.message || result.error}`);
      } else {
        console.log(`  ⚠️ Unexpected success - should have failed`);
      }
    } catch (error) {
      console.log(`  ✅ Correctly threw error: ${error.message}`);
    }
  }
}

// Test permission boundaries
async function testPermissionBoundaries() {
  console.log('\n🛡️ TESTING PERMISSION BOUNDARIES');
  console.log('==================================');

  const permissionTests = [
    {
      name: 'User trying to create admin',
      test: () => makeRequest('POST', '/api/auth/createUser', {
        username: 'user_created_admin',
        password: 'Test@123',
        email: 'usercreated@test.com',
        role: 'admin'
      }, tokens.user)
    },
    {
      name: 'Reseller trying to create admin',
      test: () => makeRequest('POST', '/api/auth/createUser', {
        username: 'reseller_created_admin',
        password: 'Test@123',
        email: 'resellercreated@test.com',
        role: 'admin'
      }, tokens.reseller)
    },
    {
      name: 'User trying to access admin endpoints',
      test: () => makeRequest('GET', '/api/auth/admin/user-credentials', null, tokens.user)
    },
    {
      name: 'Admin trying to lock accounts',
      test: () => makeRequest('POST', `/api/auth/lock-account/${userIds.user}`, {}, tokens.admin)
    },
    {
      name: 'User trying to view security logs',
      test: () => makeRequest('GET', '/api/auth/security-logs', null, tokens.user)
    }
  ];

  for (const permTest of permissionTests) {
    console.log(`\n🔒 Testing: ${permTest.name}`);
    
    const result = await permTest.test();
    
    if (!result.success) {
      console.log(`  ✅ Correctly blocked: ${result.error?.message || result.error}`);
    } else {
      console.log(`  ⚠️ Unexpected success - should have been blocked`);
    }
  }
}

// Main test runner
async function runRemainingTests() {
  console.log('🚀 TESTING REMAINING ENDPOINTS & EDGE CASES');
  console.log('============================================');
  console.log(`Base URL: ${BASE_URL}`);

  try {
    await loginAllUsers();
    await testDeveloperAPI();
    await testErrorHandling();
    await testPermissionBoundaries();
    await testLogout();

    console.log('\n🎉 ALL REMAINING TESTS COMPLETED!');
    console.log('==================================');
    
    console.log('\n📊 COMPREHENSIVE TEST SUMMARY:');
    console.log('===============================');
    console.log('✅ Authentication endpoints - TESTED');
    console.log('✅ User management CRUD - TESTED');
    console.log('✅ Security features - TESTED');
    console.log('✅ API key management - TESTED');
    console.log('✅ Password management - TESTED');
    console.log('✅ Admin endpoints - TESTED');
    console.log('✅ Developer API - TESTED');
    console.log('✅ Error handling - TESTED');
    console.log('✅ Permission boundaries - TESTED');
    console.log('✅ Logout functionality - TESTED');

  } catch (error) {
    console.error('❌ Test execution failed:', error);
  }
}

// Run tests
if (require.main === module) {
  runRemainingTests();
}

module.exports = { runRemainingTests };
