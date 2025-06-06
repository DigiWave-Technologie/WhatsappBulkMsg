const axios = require('axios');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
let authToken = '';
const userId = '683c908279841c0cdf9d72b1'; // user1

// Test user credentials (using existing superadmin1)
const testUser = {
  username: 'superadmin1',
  password: 'SuperAdmin@123'
};

// Test data
const testData = {
  userId: userId,
  categoryId: '683c8d3bdeaf429dd572df28', // Test Category
  creditAmount: 100,
  description: 'Test credit transaction'
};

// Login function
async function login() {
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: testUser.username,
      password: testUser.password
    });
    authToken = response.data.data.token;
    console.log('✅ Login successful');
    return authToken;
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    throw error;
  }
}

// Test credit balance
async function testGetCreditBalance() {
  try {
    const response = await axios.get(`${BASE_URL}/api/credits/balance/${userId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Get credit balance successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Get credit balance failed:', error.response?.data || error.message);
    throw error;
  }
}

// Test adding credits
async function testAddCredits() {
  try {
    const response = await axios.post(
      `${BASE_URL}/api/credits/add`,
      {
        userId: testData.userId,
        categoryId: testData.categoryId,
        amount: testData.creditAmount,
        description: testData.description
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    console.log('✅ Add credits successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Add credits failed:', error.response?.data || error.message);
    throw error;
  }
}

// Test credit transactions
async function testGetCreditTransactions() {
  try {
    const response = await axios.get(`${BASE_URL}/api/credits/transactions`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Get credit transactions successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Get credit transactions failed:', error.response?.data || error.message);
    throw error;
  }
}

// Test credit usage statistics
async function testGetCreditStats() {
  try {
    const response = await axios.get(`${BASE_URL}/api/credits/stats`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Get credit stats successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Get credit stats failed:', error.response?.data || error.message);
    throw error;
  }
}

// Main test function
async function runTests() {
  try {
    console.log('🚀 Starting credit management tests...\n');

    // Login first
    console.log('🔑 Logging in as superadmin1...');
    await login();

    // Run tests
    console.log(`\n📊 Testing credit balance for user1 (${userId})...`);
    await testGetCreditBalance();

    console.log(`\n💰 Testing add credits to user1 (${userId}) in Test Category...`);
    await testAddCredits();

    console.log('\n📝 Testing credit transactions...');
    await testGetCreditTransactions();

    console.log('\n📈 Testing credit statistics...');
    await testGetCreditStats();

    console.log('\n✨ All tests completed successfully!');
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

// Run the tests
runTests(); 