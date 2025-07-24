const mongoose = require('mongoose');
const whatsappOfficialTemplateService = require('./services/whatsappOfficialTemplateService');
const User = require('./models/User');
require('dotenv').config();

async function testTemplateSync() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Find the first user
        const user = await User.findOne();
        if (!user) {
            console.error('No users found. Please create a user first.');
            return;
        }

        console.log(`Testing template sync for user: ${user.email || user.name}`);

        // Test template data
        const testTemplateData = {
            template_name: `test_template_${Date.now()}`,
            category: 'marketing', // You might need to create this category first
            language: 'en_US',
            template_type: 'basic',
            header: {
                type: 'text',
                text: 'Welcome to Our Service!'
            },
            body: 'Hello {{1}}, thank you for joining us! Your account is now active.',
            footer_text: 'Best regards, Team',
            action_buttons: [
                {
                    type: 'url',
                    text: 'Visit Website',
                    url: 'https://example.com'
                }
            ],
            auto_sync_to_meta: true,
            meta_category: 'MARKETING'
        };

        console.log('\n🚀 Creating template with Meta sync...');
        console.log('Template data:', JSON.stringify(testTemplateData, null, 2));

        // Create template with Meta sync
        const result = await whatsappOfficialTemplateService.createTemplate(user._id, testTemplateData);

        console.log('\n✅ Template creation result:');
        console.log('Local Template ID:', result.localTemplate._id);
        console.log('Template Name:', result.localTemplate.template_name);
        console.log('Sync Status:', result.localTemplate.sync_status);
        console.log('Meta Status:', result.localTemplate.meta_status);
        console.log('Meta Template ID:', result.localTemplate.meta_template_id);

        if (result.syncResult.success) {
            console.log('\n🎉 Meta API sync successful!');
            console.log('Meta Response:', JSON.stringify(result.syncResult.metaResponse, null, 2));
        } else {
            console.log('\n❌ Meta API sync failed:');
            console.log('Error:', result.syncResult.error);
        }

        // Test getting template status from Meta
        if (result.localTemplate.meta_template_id) {
            console.log('\n🔍 Checking template status from Meta API...');
            try {
                const config = await whatsappOfficialTemplateService.getWhatsAppConfig(user._id);
                const metaStatus = await whatsappOfficialTemplateService.getTemplateStatus(
                    result.localTemplate.meta_template_id, 
                    config
                );
                console.log('Meta Template Status:', JSON.stringify(metaStatus, null, 2));
            } catch (statusError) {
                console.log('❌ Failed to get template status:', statusError.message);
            }
        }

    } catch (error) {
        console.error('❌ Test failed:', error);
        if (error.response?.data) {
            console.error('API Error Details:', JSON.stringify(error.response.data, null, 2));
        }
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
    }
}

// Run the test
testTemplateSync();