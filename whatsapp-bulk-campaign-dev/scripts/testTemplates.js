require('dotenv').config();
const axios = require('axios');
const mongoose = require('mongoose');

const BASE_URL = 'http://localhost:5000/api';
let authToken = '';

// Template data
const templates = {
    marketing: {
        name: "Welcome Offer",
        content: "Hello {{customer_name}}, welcome to our store! Get {{discount}}% off on your first purchase. Use code: {{coupon_code}}",
        category: "marketing",
        language: "en",
        variables: [
            { name: "customer_name", type: "string", required: true },
            { name: "discount", type: "number", required: true },
            { name: "coupon_code", type: "string", required: true }
        ]
    },
    utility: {
        name: "Order Update",
        content: "Your order #{{order_id}} has been shipped. Expected delivery: {{delivery_date}}. Tracking number: {{tracking_number}}",
        category: "utility",
        language: "en",
        variables: [
            { name: "order_id", type: "string", required: true },
            { name: "delivery_date", type: "date", required: true },
            { name: "tracking_number", type: "string", required: true }
        ]
    },
    authentication: {
        name: "OTP Verification",
        content: "Your OTP for verification is {{otp}}. Valid for {{validity}} minutes.",
        category: "authentication",
        language: "en",
        variables: [
            { name: "otp", type: "string", required: true },
            { name: "validity", type: "number", required: true }
        ]
    }
};

// Helper function to make authenticated requests
const makeRequest = async (method, endpoint, data = null) => {
    try {
        const config = {
            method,
            url: `${BASE_URL}${endpoint}`,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            }
        };

        if (data) {
            config.data = data;
        }

        const response = await axios(config);
        return response.data;
    } catch (error) {
        console.error(`Error in ${method} ${endpoint}:`, error.response?.data || error.message);
        throw error;
    }
};

// Test functions
const testTemplateManagement = async () => {
    try {
        // 1. Login as superadmin
        console.log('1. Logging in as superadmin...');
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
            username: 'superadmin',
            password: 'admin123'
        });
        authToken = loginResponse.data.data.token;
        console.log('Login successful!');

        // 2. Create templates
        console.log('\n2. Creating templates...');
        const createdTemplates = {};
        for (const [type, template] of Object.entries(templates)) {
            console.log(`Creating ${type} template...`);
            const response = await makeRequest('POST', '/templates', template);
            createdTemplates[type] = response.data;
            console.log(`${type} template created with ID:`, response.data._id);
        }

        // 3. Get all templates
        console.log('\n3. Getting all templates...');
        const allTemplates = await makeRequest('GET', '/templates');
        console.log('Total templates:', allTemplates.data.length);

        // 4. Update a template
        console.log('\n4. Updating marketing template...');
        const marketingTemplateId = createdTemplates.marketing._id;
        const updatedTemplate = await makeRequest('PUT', `/templates/${marketingTemplateId}`, {
            name: "Updated Welcome Offer",
            content: "Hello {{customer_name}}, welcome to our store! Get {{discount}}% off on your first purchase. Use code: {{coupon_code}}. Limited time offer!"
        });
        console.log('Template updated successfully');

        // 5. Get pending templates (admin only)
        console.log('\n5. Getting pending templates...');
        const pendingTemplates = await makeRequest('GET', '/templates/pending');
        console.log('Pending templates:', pendingTemplates.data.length);

        // 6. Approve templates
        console.log('\n6. Approving templates...');
        for (const template of pendingTemplates.data) {
            await makeRequest('POST', `/templates/${template._id}/approve`);
            console.log(`Template ${template._id} approved`);
        }

        // 7. Get template by ID
        console.log('\n7. Getting template by ID...');
        const templateDetails = await makeRequest('GET', `/templates/${marketingTemplateId}`);
        console.log('Template details:', templateDetails.data);

        // 8. Delete templates
        console.log('\n8. Deleting templates...');
        for (const template of Object.values(createdTemplates)) {
            await makeRequest('DELETE', `/templates/${template._id}`);
            console.log(`Template ${template._id} deleted`);
        }

        console.log('\nAll tests completed successfully!');
    } catch (error) {
        console.error('Test failed:', error.message);
    }
};

// Run the tests
testTemplateManagement(); 