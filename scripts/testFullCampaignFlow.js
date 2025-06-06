const mongoose = require('mongoose');
const axios = require('axios');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
let authToken = '';

// Test user credentials (using superadmin1)
const testUser = {
  username: 'superadmin1',
  password: 'SuperAdmin@123'
};

// Test users
const user1 = {
  id: '683c908279841c0cdf9d72b1', // user1
  username: 'user1'
};

const user2 = {
  id: '683c908279841c0cdf9d72b4', // user2
  username: 'user2'
};

// Campaign types from Category model
const campaignTypes = [
  'VIRTUAL_QUICK',
  'VIRTUAL_BUTTON',
  'VIRTUAL_DP',
  'PERSONAL_QUICK',
  'PERSONAL_BUTTON',
  'PERSONAL_POLL',
  'INTERNATIONAL_PERSONAL_QUICK',
  'INTERNATIONAL_PERSONAL_BUTTON',
  'INTERNATIONAL_PERSONAL_POLL',
  'INTERNATIONAL_VIRTUAL_QUICK',
  'INTERNATIONAL_VIRTUAL_BUTTON'
];

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

// Create a category
async function createCategory(name, campaignType, creditCost) {
  const uniqueName = `${name}_${Date.now()}`;
  try {
    const response = await axios.post(
      `${BASE_URL}/api/categories`,
      {
        name: uniqueName,
        description: `Category for ${campaignType}`,
        creditCost,
        campaignTypes: [{ type: campaignType, creditMultiplier: 1.0 }],
        isActive: true
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    console.log(`✅ Category created: ${uniqueName}`);
    return response.data.data;
  } catch (error) {
    console.error(`❌ Failed to create category ${uniqueName}:`, error.response?.data || error.message);
    throw error;
  }
}

// Create a campaign
async function createCampaign(userId, categoryId, campaignType) {
  try {
    const requestBody = {
      userId,
      categoryId,
      type: campaignType,
      name: `Campaign for ${campaignType}`,
      description: `Test campaign for ${campaignType}`,
      status: 'active',
      recipients: [
        {
          phoneNumber: '+1234567890',
          status: 'pending',
          variables: new Map(),
          metadata: {},
          retryCount: 0
        }
      ],
      message: {
        text: 'Test message'
      },
      schedule: {
        startAt: new Date().toISOString()
      }
    };
    console.log('Sending campaign request:', {
      url: `${BASE_URL}/api/campaigns`,
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
      data: requestBody
    });
    const response = await axios.post(
      `${BASE_URL}/api/campaigns`,
      requestBody,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    console.log(`✅ Campaign created for ${campaignType}`);
    return response.data.data;
  } catch (error) {
    console.error(`❌ Failed to create campaign for ${campaignType}:`, error.response?.data || error.message);
    throw error;
  }
}

// Assign credits to a user
async function assignCredits(userId, categoryId, amount) {
  try {
    const response = await axios.post(
      `${BASE_URL}/api/credits/add`,
      {
        userId,
        categoryId,
        amount,
        description: `Assigning ${amount} credits for testing`
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    console.log(`✅ Assigned ${amount} credits to user ${userId}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Failed to assign credits to user ${userId}:`, error.response?.data || error.message);
    throw error;
  }
}

// Simulate sending a message (deduct credits)
async function simulateMessageSend(userId, categoryId, campaignId, cost) {
  try {
    const response = await axios.post(
      `${BASE_URL}/api/credits/debit`,
      {
        userId,
        categoryId,
        campaignId,
        amount: cost,
        description: `Simulated message send for campaign ${campaignId}`
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    console.log(`✅ Simulated message send for user ${userId}, deducted ${cost} credits`);
    return response.data;
  } catch (error) {
    console.error(`❌ Failed to simulate message send for user ${userId}:`, error.response?.data || error.message);
    throw error;
  }
}

// Check credit balance
async function checkCreditBalance(userId) {
  try {
    const response = await axios.get(`${BASE_URL}/api/credits/balance/${userId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log(`✅ Credit balance for user ${userId}:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`❌ Failed to check credit balance for user ${userId}:`, error.response?.data || error.message);
    throw error;
  }
}

// Check credit transactions
async function checkCreditTransactions(userId) {
  try {
    const response = await axios.get(`${BASE_URL}/api/credits/transactions?userId=${userId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log(`✅ Credit transactions for user ${userId}:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`❌ Failed to check credit transactions for user ${userId}:`, error.response?.data || error.message);
    throw error;
  }
}

// Main test function
async function runFullCampaignFlow() {
  try {
    console.log('🚀 Starting full campaign flow test...\n');

    // Login first
    await login();

    // Loop through each campaign type
    for (const campaignType of campaignTypes) {
      console.log(`\n📌 Testing campaign type: ${campaignType}`);

      // Create a category for this campaign type
      const categoryName = `Category_${campaignType}`;
      const creditCost = 10; // Set a default cost
      const category = await createCategory(categoryName, campaignType, creditCost);

      // Create a campaign for user1
      const campaign1 = await createCampaign(user1.id, category._id, campaignType);

      // Create a campaign for user2
      const campaign2 = await createCampaign(user2.id, category._id, campaignType);

      // Assign credits to user1 and user2
      await assignCredits(user1.id, category._id, 100);
      await assignCredits(user2.id, category._id, 100);

      // Simulate sending a message for user1
      await simulateMessageSend(user1.id, category._id, campaign1._id, creditCost);

      // Simulate sending a message for user2
      await simulateMessageSend(user2.id, category._id, campaign2._id, creditCost);

      // Check credit balance for user1 and user2
      await checkCreditBalance(user1.id);
      await checkCreditBalance(user2.id);

      // Check credit transactions for user1 and user2
      await checkCreditTransactions(user1.id);
      await checkCreditTransactions(user2.id);
    }

    console.log('\n✨ Full campaign flow test completed successfully!');
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

// Run the full campaign flow test
runFullCampaignFlow(); 