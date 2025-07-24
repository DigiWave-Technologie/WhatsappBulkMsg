const mongoose = require('mongoose');
const WhatsAppConfig = require('./models/WhatsAppConfig');
const WhatsAppOfficialTemplate = require('./models/WhatsAppOfficialTemplate');
const WhatsAppOfficialCategory = require('./models/WhatsAppOfficialCategory');
const User = require('./models/User');
require('dotenv').config();

async function diagnoseSetup() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Check Users
        const userCount = await User.countDocuments();
        console.log(`\n👥 Users: ${userCount} found`);
        if (userCount > 0) {
            const sampleUser = await User.findOne();
            console.log(`   Sample user: ${sampleUser.email || sampleUser.name} (ID: ${sampleUser._id})`);
        }

        // Check WhatsApp Configurations
        const configCount = await WhatsAppConfig.countDocuments();
        console.log(`\n📱 WhatsApp Configs: ${configCount} found`);
        if (configCount > 0) {
            const configs = await WhatsAppConfig.find().populate('userId', 'name email');
            configs.forEach((config, index) => {
                console.log(`   Config ${index + 1}:`);
                console.log(`     User: ${config.userId?.email || config.userId?.name}`);
                console.log(`     Phone: ${config.phoneNumber}`);
                console.log(`     Business Account ID: ${config.whatsappBusinessAccountId}`);
                console.log(`     Phone Number ID: ${config.phoneNumberId}`);
                console.log(`     Token (last 20): ...${config.accessToken.slice(-20)}`);
                console.log(`     Active: ${config.is_active}`);
                console.log(`     Default: ${config.is_default}`);
            });
        }

        // Check Categories
        const categoryCount = await WhatsAppOfficialCategory.countDocuments();
        console.log(`\n📂 WhatsApp Categories: ${categoryCount} found`);
        if (categoryCount > 0) {
            const categories = await WhatsAppOfficialCategory.find();
            categories.forEach((cat, index) => {
                console.log(`   Category ${index + 1}: ${cat.name} (${cat.type})`);
            });
        } else {
            console.log('   ⚠️  No categories found. You may need to create some categories first.');
        }

        // Check Templates
        const templateCount = await WhatsAppOfficialTemplate.countDocuments();
        console.log(`\n📄 WhatsApp Templates: ${templateCount} found`);
        if (templateCount > 0) {
            const templates = await WhatsAppOfficialTemplate.find().limit(5);
            templates.forEach((template, index) => {
                console.log(`   Template ${index + 1}:`);
                console.log(`     Name: ${template.template_name}`);
                console.log(`     Language: ${template.language}`);
                console.log(`     Status: ${template.status}`);
                console.log(`     Sync Status: ${template.sync_status}`);
                console.log(`     Meta Status: ${template.meta_status}`);
                console.log(`     Meta Template ID: ${template.meta_template_id || 'Not synced'}`);
            });
        }

        // Environment Check
        console.log('\n🔧 Environment Variables:');
        console.log(`   MONGODB_URI: ${process.env.MONGODB_URI ? '✅ Set' : '❌ Missing'}`);
        console.log(`   WHATSAPP_API_KEY: ${process.env.WHATSAPP_API_KEY ? '✅ Set (...' + process.env.WHATSAPP_API_KEY.slice(-10) + ')' : '❌ Missing'}`);
        console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'Not set'}`);

        // Recommendations
        console.log('\n💡 Recommendations:');
        
        if (userCount === 0) {
            console.log('   1. Create at least one user account');
        }
        
        if (configCount === 0) {
            console.log('   2. Run setup-whatsapp-config.js to create WhatsApp configuration');
        }
        
        if (categoryCount === 0) {
            console.log('   3. Create WhatsApp template categories (marketing, utility, authentication)');
        }
        
        console.log('   4. Update WhatsApp config with your actual Business Account ID and Phone Number ID');
        console.log('   5. Test template creation with test-template-sync.js');

        // Test Meta API connectivity (basic check)
        if (configCount > 0) {
            console.log('\n🌐 Testing Meta API connectivity...');
            const config = await WhatsAppConfig.findOne({ is_active: true });
            if (config) {
                try {
                    const axios = require('axios');
                    const testUrl = `https://graph.facebook.com/v22.0/${config.whatsappBusinessAccountId}`;
                    const response = await axios.get(testUrl, {
                        headers: {
                            'Authorization': `Bearer ${config.accessToken}`
                        },
                        timeout: 10000
                    });
                    console.log('   ✅ Meta API connection successful');
                    console.log(`   Business Account: ${response.data.name || 'Unknown'}`);
                } catch (apiError) {
                    console.log('   ❌ Meta API connection failed:');
                    console.log(`   Error: ${apiError.response?.data?.error?.message || apiError.message}`);
                    if (apiError.response?.status === 401) {
                        console.log('   💡 This usually means the access token is invalid or expired');
                    }
                }
            }
        }

    } catch (error) {
        console.error('❌ Diagnosis failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

// Run the diagnosis
diagnoseSetup();