const axios = require('axios');
require('dotenv').config();

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Test credentials
const testCredentials = {
  superadmin: { username: 'superadmin1', password: 'SuperAdmin@123' },
  admin: { username: 'admin1', password: 'AdminUser@123' },
  reseller: { username: 'reseller1', password: 'Reseller@123' },
  user: { username: 'user1', password: 'NewTestUser@123' }
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
      console.log(`✅ Login successful - Token: ${responseData.token.substring(0, 20)}...`);
    } else {
      console.log(`❌ Login failed: ${result.error?.message || result.error}`);
    }
  }
}

// Test all authentication endpoints
async function testAuthEndpoints() {
  console.log('\n🔐 TESTING AUTHENTICATION ENDPOINTS');
  console.log('====================================');

  const authTests = [
    {
      name: 'Change Password',
      method: 'POST',
      endpoint: '/api/auth/change-password',
      data: { currentPassword: 'NewTestUser@123', newPassword: 'UpdatedPassword@123' },
      testWith: ['user']
    },
    {
      name: 'Force Password Reset',
      method: 'POST',
      endpoint: `/api/auth/force-password-reset/${userIds.user}`,
      testWith: ['superadmin']
    },
    {
      name: 'Generate API Key',
      method: 'POST',
      endpoint: '/api/auth/generate-api-key',
      testWith: ['superadmin', 'admin', 'user']
    },
    {
      name: 'Revoke API Key',
      method: 'POST',
      endpoint: '/api/auth/revoke-api-key',
      testWith: ['superadmin']
    }
  ];

  for (const test of authTests) {
    console.log(`\n🔗 Testing: ${test.name}`);
    
    for (const role of test.testWith) {
      console.log(`  👤 Testing with ${role}`);
      
      const result = await makeRequest(test.method, test.endpoint, test.data, tokens[role]);
      
      if (result.success) {
        console.log(`    ✅ Success: ${result.data?.message || 'OK'}`);
      } else {
        console.log(`    ❌ Failed: ${result.error?.message || result.error}`);
      }
    }
  }
}

// Test user management endpoints
async function testUserManagementEndpoints() {
  console.log('\n👥 TESTING USER MANAGEMENT ENDPOINTS');
  console.log('=====================================');

  const userTests = [
    {
      name: 'Get All Users',
      method: 'GET',
      endpoint: '/api/auth/users',
      testWith: ['superadmin', 'admin', 'reseller', 'user']
    },
    {
      name: 'Create User',
      method: 'POST',
      endpoint: '/api/auth/createUser',
      data: {
        username: 'endpoint_test_user',
        password: 'TestUser@123',
        email: 'endpointtest@test.com',
        firstName: 'Endpoint',
        lastName: 'Test',
        role: 'user'
      },
      testWith: ['superadmin', 'admin', 'reseller']
    },
    {
      name: 'Update User',
      method: 'PUT',
      endpoint: `/api/auth/update-user/${userIds.user}`,
      data: { firstName: 'Updated', lastName: 'User' },
      testWith: ['superadmin', 'admin']
    },
    {
      name: 'Delete User',
      method: 'DELETE',
      endpoint: `/api/auth/delete-user/${userIds.user}`,
      testWith: ['superadmin']
    }
  ];

  for (const test of userTests) {
    console.log(`\n🔗 Testing: ${test.name}`);
    
    for (const role of test.testWith) {
      console.log(`  👤 Testing with ${role}`);
      
      const result = await makeRequest(test.method, test.endpoint, test.data, tokens[role]);
      
      if (result.success) {
        console.log(`    ✅ Success: ${result.data?.message || 'OK'}`);
      } else {
        console.log(`    ❌ Failed: ${result.error?.message || result.error}`);
      }
    }
  }
}

// Test security endpoints
async function testSecurityEndpoints() {
  console.log('\n🔒 TESTING SECURITY ENDPOINTS');
  console.log('==============================');

  const securityTests = [
    {
      name: 'Lock Account',
      method: 'POST',
      endpoint: `/api/auth/lock-account/${userIds.user}`,
      testWith: ['superadmin']
    },
    {
      name: 'Unlock Account',
      method: 'POST',
      endpoint: `/api/auth/unlock-account/${userIds.user}`,
      testWith: ['superadmin']
    },
    {
      name: 'Get Security Logs',
      method: 'GET',
      endpoint: '/api/auth/security-logs',
      testWith: ['superadmin']
    },
    {
      name: 'Get Security Audit',
      method: 'GET',
      endpoint: `/api/auth/security-audit/${userIds.user}`,
      testWith: ['superadmin']
    },
    {
      name: 'Get Active Sessions',
      method: 'GET',
      endpoint: '/api/auth/active-sessions',
      testWith: ['superadmin', 'admin', 'user']
    },
    {
      name: 'Get User Active Sessions',
      method: 'GET',
      endpoint: `/api/auth/active-sessions/${userIds.user}`,
      testWith: ['superadmin']
    }
  ];

  for (const test of securityTests) {
    console.log(`\n🔗 Testing: ${test.name}`);
    
    for (const role of test.testWith) {
      console.log(`  👤 Testing with ${role}`);
      
      const result = await makeRequest(test.method, test.endpoint, test.data, tokens[role]);
      
      if (result.success) {
        console.log(`    ✅ Success: ${result.data?.message || 'OK'}`);
      } else {
        console.log(`    ❌ Failed: ${result.error?.message || result.error}`);
      }
    }
  }
}

// Test admin endpoints
async function testAdminEndpoints() {
  console.log('\n👨‍💼 TESTING ADMIN ENDPOINTS');
  console.log('=============================');

  const adminTests = [
    {
      name: 'Admin Change User Password',
      method: 'POST',
      endpoint: `/api/auth/admin/change-user-password/${userIds.user}`,
      data: { newPassword: 'AdminChanged@123' },
      testWith: ['superadmin']
    },
    {
      name: 'Get All User Credentials',
      method: 'GET',
      endpoint: '/api/auth/admin/user-credentials',
      testWith: ['superadmin']
    }
  ];

  for (const test of adminTests) {
    console.log(`\n🔗 Testing: ${test.name}`);
    
    for (const role of test.testWith) {
      console.log(`  👤 Testing with ${role}`);
      
      const result = await makeRequest(test.method, test.endpoint, test.data, tokens[role]);
      
      if (result.success) {
        console.log(`    ✅ Success: ${result.data?.message || 'OK'}`);
      } else {
        console.log(`    ❌ Failed: ${result.error?.message || result.error}`);
      }
    }
  }
}

// Main test runner
async function runAllEndpointTests() {
  console.log('🚀 COMPREHENSIVE ENDPOINT TESTING');
  console.log('==================================');
  console.log(`Base URL: ${BASE_URL}`);

  try {
    await loginAllUsers();
    await testAuthEndpoints();
    await testUserManagementEndpoints();
    await testSecurityEndpoints();
    await testAdminEndpoints();

    console.log('\n🎉 ALL ENDPOINT TESTS COMPLETED!');
    console.log('=================================');
    
    console.log('\n📋 ACTIVE TOKENS:');
    Object.entries(tokens).forEach(([role, token]) => {
      console.log(`${role}: ${token?.substring(0, 30)}...`);
    });

  } catch (error) {
    console.error('❌ Test execution failed:', error);
  }
}

// Run tests
if (require.main === module) {
  runAllEndpointTests();
}

module.exports = { runAllEndpointTests };
