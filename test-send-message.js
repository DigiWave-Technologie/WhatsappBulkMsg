require('dotenv').config();
const whatsappService = require('./services/whatsappService');

async function testSendMessage() {
    try {
        console.log('Testing WhatsApp message sending...');
        
        // Using exact same parameters as the working curl command
        const result = await whatsappService.sendTemplateMessage(
            '919624185617',  // to
            'hello_world',   // template name
            'en_US'         // language code
        );
        
        console.log('Template message sent successfully!');
        console.log('Response:', result);
        
    } catch (error) {
        console.error('Error sending message:', error.response?.data || error.message);
    }
}

// Run the test
testSendMessage();