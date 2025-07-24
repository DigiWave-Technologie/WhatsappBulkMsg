const mongoose = require('mongoose');
const WhatsAppConfig = require('./models/WhatsAppConfig');
const User = require('./models/User');
require('dotenv').config();

// Your new WhatsApp token
const NEW_ACCESS_TOKEN = 'EAAaWMPrfZA38BPCm4LS0Vm53c2Hv9AQY7ZBxKFhjSkH9QvvdC5Vc9wghHgX6yrlqR38ZBzZCt3ndbanwc6tdNJnMwtJtRGOqgeyHR3PfirJZCZCh8kjND6zbZCIDaGRiybKu8HCAy3gX2EcasJVKeRhfnSvZBVc3IDkIivkCWK8XielZCCEje64TRoGthjPaKRVPv3ggvayFlU2BevHAVatAwsmBI7ZCuwljlbNtXxoR9m4EHkNfnQzZAVPTpUEmQZDZDthis';

async function setupWhatsAppConfig() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Find the first user (you can modify this to target specific user)
        const user = await User.findOne();
        if (!user) {
            console.error('No users found. Please create a user first.');
            return;
        }

        console.log(`Setting up WhatsApp config for user: ${user.email || user.name}`);

        // Check if config already exists
        let config = await WhatsAppConfig.findOne({ userId: user._id });

        const configData = {
            userId: user._id,
            phoneNumber: '+1234567890', // Replace with your actual phone number
            whatsappBusinessAccountId: 'YOUR_BUSINESS_ACCOUNT_ID', // Replace with your actual business account ID
            phoneNumberId: 'YOUR_PHONE_NUMBER_ID', // Replace with your actual phone number ID
            accessToken: NEW_ACCESS_TOKEN,
            name: 'Main WhatsApp Config',
            description: 'Primary WhatsApp configuration for template sync',
            is_active: true,
            is_default: true,
            created_by: user._id
        };

        if (config) {
            // Update existing configuration
            await WhatsAppConfig.findByIdAndUpdate(config._id, {
                ...configData,
                updated_by: user._id
            });
            console.log('✅ WhatsApp configuration updated successfully');
        } else {
            // Create new configuration
            config = await WhatsAppConfig.create(configData);
            console.log('✅ WhatsApp configuration created successfully');
        }

        console.log('Configuration details:');
        console.log(`- User ID: ${config.userId}`);
        console.log(`- Phone Number: ${config.phoneNumber}`);
        console.log(`- Business Account ID: ${config.whatsappBusinessAccountId}`);
        console.log(`- Phone Number ID: ${config.phoneNumberId}`);
        console.log(`- Token (last 20 chars): ...${config.accessToken.slice(-20)}`);
        console.log(`- Active: ${config.is_active}`);
        console.log(`- Default: ${config.is_default}`);

        console.log('\n📝 Next steps:');
        console.log('1. Update the phoneNumber, whatsappBusinessAccountId, and phoneNumberId with your actual values');
        console.log('2. Test template creation with Meta sync');
        console.log('3. Check the logs for any sync issues');

    } catch (error) {
        console.error('❌ Error setting up WhatsApp config:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

// Run the setup
setupWhatsAppConfig();