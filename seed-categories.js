const mongoose = require('mongoose');
const WhatsAppOfficialCategory = require('./models/WhatsAppOfficialCategory');
const User = require('./models/User');
require('dotenv').config();

async function seedCategories() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Find the first user to use as creator
        const user = await User.findOne();
        if (!user) {
            console.error('❌ No users found. Please create a user first.');
            return;
        }

        console.log(`Creating categories for user: ${user.email || user.name}`);

        // Default categories to create
        const categories = [
            {
                name: 'marketing',
                description: 'Marketing and promotional templates',
                type: 'marketing'
            },
            {
                name: 'utility',
                description: 'Utility and informational templates',
                type: 'utility'
            },
            {
                name: 'authentication',
                description: 'Authentication and verification templates',
                type: 'transactional'
            },
            {
                name: 'notifications',
                description: 'Notification and alert templates',
                type: 'utility'
            },
            {
                name: 'welcome',
                description: 'Welcome and onboarding templates',
                type: 'marketing'
            }
        ];

        console.log('\n🌱 Seeding categories...');

        for (const categoryData of categories) {
            try {
                // Check if category already exists
                const existingCategory = await WhatsAppOfficialCategory.findOne({ 
                    name: categoryData.name 
                });

                if (existingCategory) {
                    console.log(`   ⏭️  Category '${categoryData.name}' already exists`);
                    continue;
                }

                // Create new category
                const category = await WhatsAppOfficialCategory.create({
                    ...categoryData,
                    created_by: user._id
                });

                console.log(`   ✅ Created category: ${category.name} (${category.type})`);
            } catch (error) {
                console.log(`   ❌ Failed to create category '${categoryData.name}': ${error.message}`);
            }
        }

        // Display all categories
        console.log('\n📂 All categories:');
        const allCategories = await WhatsAppOfficialCategory.find().populate('created_by', 'name email');
        allCategories.forEach((cat, index) => {
            console.log(`   ${index + 1}. ${cat.name} (${cat.type}) - ${cat.description}`);
            console.log(`      Created by: ${cat.created_by?.email || cat.created_by?.name}`);
            console.log(`      Active: ${cat.is_active}`);
            console.log(`      ID: ${cat._id}`);
        });

        console.log('\n🎉 Category seeding completed!');

    } catch (error) {
        console.error('❌ Seeding failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

// Run the seeder
seedCategories();