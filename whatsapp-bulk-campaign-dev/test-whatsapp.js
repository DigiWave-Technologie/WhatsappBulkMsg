require('dotenv').config();
const whatsappService = require('./services/whatsappService');

async function testWhatsAppIntegration() {
    try {
        console.log('Testing WhatsApp Integration...');
        
        // Test 1: Send a text message
        console.log('\nTest 1: Sending text message...');
        const textResult = await whatsappService.sendTextMessage(
            'YOUR_TEST_PHONE_NUMBER', // Replace with your test phone number
            'Hello! This is a test message from WhatsApp API integration.'
        );
        console.log('Text message sent successfully:', textResult);

        // Test 2: Validate a phone number
        console.log('\nTest 2: Validating phone number...');
        const validationResult = await whatsappService.validateNumber('YOUR_TEST_PHONE_NUMBER');
        console.log('Phone number validation result:', validationResult);

        // Test 3: Get business profile
        console.log('\nTest 3: Getting business profile...');
        const profileResult = await whatsappService.getBusinessProfile();
        console.log('Business profile:', profileResult);

        console.log('\nAll tests completed successfully!');
    } catch (error) {
        console.error('Error during testing:', error.response?.data || error.message);
    }
}

// Run the tests
testWhatsAppIntegration(); 