const axios = require('axios');
require('dotenv').config();

const BASE_URL = process.env.API_URL || 'http://localhost:3000/api';
let authToken = null;

// Test user credentials
const testUser = {
    email: 'test@example.com',
    password: 'test123'
};

// Helper function to login and get token
async function login() {
    try {
        const response = await axios.post(`${BASE_URL}/auth/login`, testUser);
        authToken = response.data.token;
        console.log('Successfully logged in and got token');
        return authToken;
    } catch (error) {
        console.error('Login failed:', error.response?.data || error.message);
        throw error;
    }
}

// Helper function to make authenticated requests
async function makeRequest(method, endpoint, data = null) {
    if (!authToken) {
        await login();
    }

    const config = {
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
        }
    };

    try {
        const url = `${BASE_URL}${endpoint}`;
        let response;

        switch (method.toLowerCase()) {
            case 'get':
                response = await axios.get(url, config);
                break;
            case 'post':
                response = await axios.post(url, data, config);
                break;
            case 'put':
                response = await axios.put(url, data, config);
                break;
            case 'delete':
                response = await axios.delete(url, config);
                break;
            default:
                throw new Error(`Unsupported method: ${method}`);
        }

        return response.data;
    } catch (error) {
        console.error(`Request failed (${method} ${endpoint}):`, error.response?.data || error.message);
        throw error;
    }
}

// Test all credit management endpoints
async function testCreditEndpoints() {
    try {
        // Login first
        await login();
        console.log('\n=== Starting Credit Management Endpoint Tests ===\n');

        // 1. Get Credit Balance
        console.log('1. Testing Get Credit Balance');
        const balance = await makeRequest('get', '/credits/balance');
        console.log('Credit Balance:', balance);
        console.log('---\n');

        // 2. Get Credit Transactions
        console.log('2. Testing Get Credit Transactions');
        const transactions = await makeRequest('get', '/credits/transactions');
        console.log('Credit Transactions:', transactions);
        console.log('---\n');

        // 3. Get Campaign Type Credit Balance
        console.log('3. Testing Get Campaign Type Credit Balance');
        const campaignBalance = await makeRequest('get', '/credits/campaign-balance');
        console.log('Campaign Type Credit Balance:', campaignBalance);
        console.log('---\n');

        // 4. Transfer Credits
        console.log('4. Testing Credit Transfer');
        const transferData = {
            toUserId: 'recipient_user_id', // Replace with actual user ID
            categoryId: 'category_id', // Replace with actual category ID
            amount: 100,
            description: 'Test credit transfer'
        };
        const transfer = await makeRequest('post', '/credits/transfer', transferData);
        console.log('Credit Transfer Result:', transfer);
        console.log('---\n');

        // 5. Debit Credits
        console.log('5. Testing Credit Debit');
        const debitData = {
            userId: 'user_id', // Replace with actual user ID
            categoryId: 'category_id', // Replace with actual category ID
            amount: 50,
            description: 'Test credit debit'
        };
        const debit = await makeRequest('post', '/credits/debit', debitData);
        console.log('Credit Debit Result:', debit);
        console.log('---\n');

        // 6. Get User Credit Transactions
        console.log('6. Testing Get User Credit Transactions');
        const userId = 'user_id'; // Replace with actual user ID
        const userTransactions = await makeRequest('get', `/credits/transactions/${userId}`);
        console.log('User Credit Transactions:', userTransactions);
        console.log('---\n');

        // 7. Get User Category Credit Transactions
        console.log('7. Testing Get User Category Credit Transactions');
        const categoryId = 'category_id'; // Replace with actual category ID
        const categoryTransactions = await makeRequest('get', `/credits/transactions/${userId}/${categoryId}`);
        console.log('User Category Credit Transactions:', categoryTransactions);
        console.log('---\n');

        console.log('All credit management endpoint tests completed successfully!');

    } catch (error) {
        console.error('Error during endpoint testing:', error);
    }
}

// Run the tests
testCreditEndpoints(); 