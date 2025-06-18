const axios = require('axios');
const { testUsers } = require('./setupTestUsers');
require('dotenv').config();

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Store tokens for different users
const userTokens = {};
const userIds = {};

// Helper function to make API requests
async function makeRequest(method, endpoint, data = null, token = null, apiKey = null) {
  try {
    const headers = {
      'Content-Type': 'application/json'
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else if (apiKey) {
      headers['X-API-Key'] = apiKey;
    }

    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers,
      ...(data && { data })
    };

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

// Test login for all users
async function testLogin() {
  console.log('\n🔐 TESTING LOGIN FOR ALL USERS');
  console.log('================================');

  for (const user of testUsers) {
    console.log(`\n👤 Testing login for ${user.username} (${user.role})`);
    
    const result = await makeRequest('POST', '/api/auth/login', {
      username: user.username,
      password: user.password
    });

    if (result.success) {
      const responseData = result.data.data || result.data;
      userTokens[user.username] = responseData.token;
      userIds[user.username] = responseData.user?.id || responseData.user?.userId || responseData.userId;
      console.log(`✅ Login successful for ${user.username}`);
      console.log(`   Token: ${responseData.token.substring(0, 20)}...`);
      console.log(`   User ID: ${userIds[user.username]}`);
    } else {
      console.log(`❌ Login failed for ${user.username}:`, result.error);
    }
  }
}

// Test user creation with different roles
async function testUserCreation() {
  console.log('\n👥 TESTING USER CREATION WITH DIFFERENT ROLES');
  console.log('==============================================');

  const testCases = [
    {
      creator: 'superadmin1',
      newUser: {
        username: 'test_admin_created_by_superadmin',
        password: 'TestAdmin@123',
        email: 'test_admin@test.com',
        firstName: 'Test',
        lastName: 'Admin',
        role: 'admin',
        permissions: JSON.stringify({
          virtual: true,
          personal: true,
          internationalPersonal: false,
          internationalVirtual: false
        }),
        rolePermissions: JSON.stringify({
          canCreateUsers: true,
          canUpdateUsers: true,
          canDeleteUsers: false,
          canViewAllUsers: true
        })
      }
    },
    {
      creator: 'admin1',
      newUser: {
        username: 'test_reseller_created_by_admin',
        password: 'TestReseller@123',
        email: 'test_reseller@test.com',
        firstName: 'Test',
        lastName: 'Reseller',
        role: 'reseller',
        permissions: JSON.stringify({
          virtual: true,
          personal: false,
          internationalPersonal: false,
          internationalVirtual: false
        })
      }
    },
    {
      creator: 'reseller1',
      newUser: {
        username: 'test_user_created_by_reseller',
        password: 'TestUser@123',
        email: 'test_user_reseller@test.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'user'
      }
    },
    {
      creator: 'user1',
      newUser: {
        username: 'test_user_created_by_user',
        password: 'TestUser@123',
        email: 'test_user_user@test.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'user'
      },
      shouldFail: true
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n🔨 ${testCase.creator} creating ${testCase.newUser.role}: ${testCase.newUser.username}`);
    
    const result = await makeRequest(
      'POST',
      '/api/auth/createUser',
      testCase.newUser,
      userTokens[testCase.creator]
    );

    if (testCase.shouldFail) {
      if (!result.success) {
        console.log(`✅ Expected failure: ${result.error.message || result.error}`);
      } else {
        console.log(`❌ Unexpected success - should have failed!`);
      }
    } else {
      if (result.success) {
        console.log(`✅ User created successfully`);
        console.log(`   User ID: ${result.data.userId || result.data.data?.userId || 'N/A'}`);
      } else {
        console.log(`❌ User creation failed:`, result.error);
      }
    }
  }
}

// Test getting all users with different roles
async function testGetAllUsers() {
  console.log('\n📋 TESTING GET ALL USERS WITH DIFFERENT ROLES');
  console.log('==============================================');

  for (const user of testUsers) {
    console.log(`\n👤 ${user.username} (${user.role}) getting all users`);
    
    const result = await makeRequest(
      'GET',
      '/api/auth/users',
      null,
      userTokens[user.username]
    );

    if (result.success) {
      const users = result.data.users || result.data.data || result.data || [];
      console.log(`✅ Retrieved ${users.length} users`);
      console.log(`   Users: ${users.map(u => u.username).join(', ')}`);
    } else {
      console.log(`❌ Failed to get users:`, result.error);
    }
  }
}

// Test security features
async function testSecurityFeatures() {
  console.log('\n🔒 TESTING SECURITY FEATURES');
  console.log('=============================');

  // Test account locking (Super Admin only)
  console.log('\n🔐 Testing account locking');
  const lockResult = await makeRequest(
    'POST',
    `/api/auth/lock-account/${userIds['user1']}`,
    {},
    userTokens['superadmin1']
  );

  if (lockResult.success) {
    console.log('✅ Account locked successfully');
    
    // Test login with locked account
    const loginResult = await makeRequest('POST', '/api/auth/login', {
      username: 'user1',
      password: 'TestUser@123'
    });

    if (!loginResult.success) {
      console.log('✅ Login correctly blocked for locked account');
    } else {
      console.log('❌ Login should have been blocked for locked account');
    }

    // Unlock the account
    const unlockResult = await makeRequest(
      'POST',
      `/api/auth/unlock-account/${userIds['user1']}`,
      {},
      userTokens['superadmin1']
    );

    if (unlockResult.success) {
      console.log('✅ Account unlocked successfully');
    }
  } else {
    console.log('❌ Account locking failed:', lockResult.error);
  }
}

// Test API key management
async function testApiKeyManagement() {
  console.log('\n🔑 TESTING API KEY MANAGEMENT');
  console.log('==============================');

  for (const user of testUsers) {
    console.log(`\n🔑 Testing API key for ${user.username} (${user.role})`);
    
    // Generate API key
    const generateResult = await makeRequest(
      'POST',
      '/api/auth/generate-api-key',
      {},
      userTokens[user.username]
    );

    if (generateResult.success) {
      const apiKey = generateResult.data.apiKey || generateResult.data.data?.apiKey || 'N/A';
      console.log(`✅ API key generated: ${apiKey.substring ? apiKey.substring(0, 20) + '...' : apiKey}`);

      // Revoke API key
      const revokeResult = await makeRequest(
        'POST',
        '/api/auth/revoke-api-key',
        {},
        userTokens[user.username]
      );

      if (revokeResult.success) {
        console.log('✅ API key revoked successfully');
      } else {
        console.log('❌ API key revocation failed:', revokeResult.error);
      }
    } else {
      console.log('❌ API key generation failed:', generateResult.error);
    }
  }
}

// Test password management
async function testPasswordManagement() {
  console.log('\n🔐 TESTING PASSWORD MANAGEMENT');
  console.log('===============================');

  // Test password change
  console.log('\n🔄 Testing password change for user1');
  const changeResult = await makeRequest(
    'POST',
    '/api/auth/change-password',
    {
      currentPassword: 'TestUser@123',
      newPassword: 'NewTestUser@123'
    },
    userTokens['user1']
  );

  if (changeResult.success) {
    console.log('✅ Password changed successfully');
    
    // Test login with new password
    const loginResult = await makeRequest('POST', '/api/auth/login', {
      username: 'user1',
      password: 'NewTestUser@123'
    });

    if (loginResult.success) {
      console.log('✅ Login successful with new password');
      userTokens['user1'] = loginResult.data.token; // Update token
    } else {
      console.log('❌ Login failed with new password');
    }
  } else {
    console.log('❌ Password change failed:', changeResult.error);
  }

  // Test force password reset (Super Admin only)
  console.log('\n🔄 Testing force password reset');
  const forceResetResult = await makeRequest(
    'POST',
    `/api/auth/force-password-reset/${userIds['user2']}`,
    {},
    userTokens['superadmin1']
  );

  if (forceResetResult.success) {
    console.log('✅ Force password reset successful');
  } else {
    console.log('❌ Force password reset failed:', forceResetResult.error);
  }
}

// Test all endpoints comprehensively
async function testAllEndpoints() {
  console.log('\n🔗 TESTING ALL USER MANAGEMENT ENDPOINTS');
  console.log('=========================================');

  const endpoints = [
    // Authentication endpoints
    { method: 'POST', path: '/api/auth/logout', requiresAuth: true, testWith: ['superadmin1', 'admin1', 'user1'] },

    // User management endpoints
    { method: 'PUT', path: '/api/auth/update-user/{userId}', requiresAuth: true, testWith: ['superadmin1', 'admin1'] },
    { method: 'DELETE', path: '/api/auth/delete-user/{userId}', requiresAuth: true, testWith: ['superadmin1'] },

    // Security endpoints
    { method: 'GET', path: '/api/auth/security-logs', requiresAuth: true, testWith: ['superadmin1'] },
    { method: 'GET', path: '/api/auth/active-sessions', requiresAuth: true, testWith: ['superadmin1', 'admin1', 'user1'] },
    { method: 'GET', path: '/api/auth/active-sessions/{userId}', requiresAuth: true, testWith: ['superadmin1'] },

    // Admin endpoints
    { method: 'POST', path: '/api/auth/admin/change-user-password/{userId}', requiresAuth: true, testWith: ['superadmin1'] },
    { method: 'GET', path: '/api/auth/admin/user-credentials', requiresAuth: true, testWith: ['superadmin1'] }
  ];

  for (const endpoint of endpoints) {
    console.log(`\n🔗 Testing ${endpoint.method} ${endpoint.path}`);

    for (const username of endpoint.testWith) {
      console.log(`  👤 Testing with ${username} (${testUsers.find(u => u.username === username)?.role})`);

      let path = endpoint.path;
      if (path.includes('{userId}')) {
        path = path.replace('{userId}', userIds['user2']); // Use user2 as target
      }

      let body = null;
      if (endpoint.method === 'PUT' && path.includes('update-user')) {
        body = { firstName: 'Updated', lastName: 'Name' };
      } else if (endpoint.method === 'POST' && path.includes('change-user-password')) {
        body = { newPassword: 'NewPassword@123' };
      }

      const result = await makeRequest(endpoint.method, path, body, userTokens[username]);

      if (result.success) {
        console.log(`    ✅ Success: ${result.data?.message || 'OK'}`);
      } else {
        console.log(`    ❌ Failed: ${result.error?.message || result.error}`);
      }
    }
  }
}

// Test profile management
async function testProfileManagement() {
  console.log('\n👤 TESTING PROFILE MANAGEMENT');
  console.log('==============================');

  // Test profile picture upload (simulated)
  console.log('\n📸 Testing profile picture endpoints');
  for (const username of ['superadmin1', 'admin1', 'user1']) {
    console.log(`\n👤 Testing profile management for ${username}`);

    // Note: File upload testing would require actual file data
    console.log('  📸 Profile picture upload - requires multipart/form-data (skip in API test)');
    console.log('  🏢 Logo upload - requires multipart/form-data (skip in API test)');
  }
}

// Test developer API endpoints
async function testDeveloperAPI() {
  console.log('\n🔧 TESTING DEVELOPER API ENDPOINTS');
  console.log('===================================');

  const devEndpoints = [
    { method: 'POST', path: '/api/developer/admin/users' },
    { method: 'GET', path: '/api/developer/admin/users' },
    { method: 'PUT', path: '/api/developer/admin/users/{id}' },
    { method: 'DELETE', path: '/api/developer/admin/users/{id}' },
    { method: 'POST', path: '/api/developer/admin/users/{id}/credits' }
  ];

  console.log('📝 Note: Developer API endpoints require API key authentication');
  console.log('🔑 Testing with generated API keys...');

  // Generate API key for testing
  const apiKeyResult = await makeRequest('POST', '/api/auth/generate-api-key', {}, userTokens['superadmin1']);

  if (apiKeyResult.success) {
    const apiKey = apiKeyResult.data.apiKey || apiKeyResult.data.data?.apiKey;
    console.log(`✅ Generated API key for testing: ${apiKey?.substring(0, 20)}...`);

    // Test developer endpoints with API key
    for (const endpoint of devEndpoints) {
      console.log(`\n🔗 Testing ${endpoint.method} ${endpoint.path}`);

      let path = endpoint.path;
      if (path.includes('{id}')) {
        path = path.replace('{id}', userIds['user2']);
      }

      let body = null;
      if (endpoint.method === 'POST' && path.includes('/users') && !path.includes('/credits')) {
        body = {
          username: 'dev_test_user',
          password: 'DevTest@123',
          email: 'dev@test.com',
          role: 'user'
        };
      } else if (endpoint.method === 'POST' && path.includes('/credits')) {
        body = { amount: 100, type: 'virtual_quick' };
      } else if (endpoint.method === 'PUT') {
        body = { firstName: 'Updated Dev User' };
      }

      // Use API key in header instead of Bearer token
      const result = await makeRequest(endpoint.method, path, body, null, apiKey);

      if (result.success) {
        console.log(`  ✅ Success: ${result.data?.message || 'OK'}`);
      } else {
        console.log(`  ❌ Failed: ${result.error?.message || result.error}`);
      }
    }
  } else {
    console.log('❌ Failed to generate API key for developer testing');
  }
}

// Test edge cases and error handling
async function testEdgeCases() {
  console.log('\n⚠️ TESTING EDGE CASES AND ERROR HANDLING');
  console.log('=========================================');

  const edgeCases = [
    {
      name: 'Invalid token',
      test: () => makeRequest('GET', '/api/auth/users', null, 'invalid_token')
    },
    {
      name: 'Expired token',
      test: () => makeRequest('GET', '/api/auth/users', null, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2MDAwMDAwMDB9.invalid')
    },
    {
      name: 'Missing required fields in user creation',
      test: () => makeRequest('POST', '/api/auth/createUser', { username: 'incomplete' }, userTokens['superadmin1'])
    },
    {
      name: 'Invalid user ID in update',
      test: () => makeRequest('PUT', '/api/auth/update-user/invalid_id', { firstName: 'Test' }, userTokens['superadmin1'])
    },
    {
      name: 'Weak password',
      test: () => makeRequest('POST', '/api/auth/change-password', { currentPassword: 'NewTestUser@123', newPassword: '123' }, userTokens['user1'])
    },
    {
      name: 'Non-existent user login',
      test: () => makeRequest('POST', '/api/auth/login', { username: 'nonexistent', password: 'password' })
    }
  ];

  for (const edgeCase of edgeCases) {
    console.log(`\n🧪 Testing: ${edgeCase.name}`);
    try {
      const result = await edgeCase.test();
      if (!result.success) {
        console.log(`  ✅ Correctly handled: ${result.error?.message || result.error}`);
      } else {
        console.log(`  ⚠️ Unexpected success - should have failed`);
      }
    } catch (error) {
      console.log(`  ✅ Correctly threw error: ${error.message}`);
    }
  }
}

// Main test function
async function runAllTests() {
  console.log('🚀 STARTING COMPREHENSIVE USER MANAGEMENT TESTS');
  console.log('================================================');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Test Users: ${testUsers.length}`);

  try {
    await testLogin();
    await testUserCreation();
    await testGetAllUsers();
    await testSecurityFeatures();
    await testApiKeyManagement();
    await testPasswordManagement();
    await testAllEndpoints();
    await testProfileManagement();
    await testDeveloperAPI();
    await testEdgeCases();

    console.log('\n🎉 ALL COMPREHENSIVE TESTS COMPLETED!');
    console.log('=====================================');

    // Print summary of tokens for Postman testing
    console.log('\n📋 TOKENS FOR POSTMAN TESTING:');
    console.log('===============================');
    Object.entries(userTokens).forEach(([username, token]) => {
      console.log(`${username}: ${token}`);
    });

    // Print test summary
    console.log('\n📊 TEST SUMMARY:');
    console.log('=================');
    console.log('✅ Authentication endpoints tested');
    console.log('✅ User management CRUD tested');
    console.log('✅ Security features tested');
    console.log('✅ API key management tested');
    console.log('✅ Password management tested');
    console.log('✅ All additional endpoints tested');
    console.log('✅ Profile management noted');
    console.log('✅ Developer API tested');
    console.log('✅ Edge cases and error handling tested');

  } catch (error) {
    console.error('❌ Test execution failed:', error);
  }
}

// Run tests if called directly
if (require.main === module) {
  runAllTests();
}

module.exports = { runAllTests, userTokens, userIds };
