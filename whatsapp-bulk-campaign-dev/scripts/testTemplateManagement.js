const mongoose = require('mongoose');
const Template = require('../models/Template');
const Category = require('../models/Category');
const User = require('../models/User');
require('dotenv').config();

// Test data
const testData = {
    categories: [
        {
            name: 'marketing',
            description: 'Marketing related templates',
            creditCost: 1
        },
        {
            name: 'utility',
            description: 'Utility related templates',
            creditCost: 2
        },
        {
            name: 'authentication',
            description: 'Authentication related templates',
            creditCost: 3
        }
    ],
    templates: [
        {
            name: 'Welcome Message',
            content: 'Welcome {{name}} to our service! Your verification code is {{code}}.',
            category: 'marketing',
            language: 'en',
            status: 'pending',
            variables: [
                { name: 'name', type: 'string', required: true },
                { name: 'code', type: 'string', required: true }
            ]
        },
        {
            name: 'Order Confirmation',
            content: 'Hello {{customer_name}}, your order #{{order_id}} has been confirmed. Total amount: {{amount}}',
            category: 'utility',
            language: 'en',
            status: 'pending',
            variables: [
                { name: 'customer_name', type: 'string', required: true },
                { name: 'order_id', type: 'string', required: true },
                { name: 'amount', type: 'currency', required: true }
            ]
        },
        {
            name: 'OTP Verification',
            content: 'Your OTP for verification is {{otp}}. Valid for {{minutes}} minutes.',
            category: 'authentication',
            language: 'en',
            status: 'pending',
            variables: [
                { name: 'otp', type: 'string', required: true },
                { name: 'minutes', type: 'number', required: true }
            ]
        }
    ],
    languages: ['en', 'es', 'fr', 'de', 'hi'],
    statuses: ['pending', 'approved', 'rejected']
};

async function testTemplateManagement() {
    try {
        // Connect to MongoDB
        await mongoose.connect('mongodb://127.0.0.1:27017/whatsapp_bulk_campaign', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to MongoDB');

        // Create test users
        const superAdmin = await User.findOne({ role: 'super_admin' });
        if (!superAdmin) {
            throw new Error('Super admin not found');
        }

        const testUser = await User.findOne({ role: 'user' });
        if (!testUser) {
            throw new Error('Test user not found');
        }

        // Test 1: Create Categories
        console.log('\n=== Testing Category Creation ===');
        const createdCategories = [];
        for (const categoryData of testData.categories) {
            const category = await Category.findOneAndUpdate(
                { name: categoryData.name },
                categoryData,
                { upsert: true, new: true }
            );
            createdCategories.push(category);
            console.log(`Created/Updated category: ${category.name}`);
        }

        // Test 2: Create Templates with Different Combinations
        console.log('\n=== Testing Template Creation ===');
        const createdTemplates = [];
        for (const templateData of testData.templates) {
            const template = await Template.create({
                name: templateData.name,
                content: templateData.content,
                category: templateData.category,
                language: templateData.language,
                status: templateData.status,
                userId: testUser._id,
                variables: templateData.variables
            });
            createdTemplates.push(template);
            console.log(`Created template: ${template.name}`);
            console.log('Variables extracted:', template.variables);
        }

        // Test 3: Template Approval Workflow
        console.log('\n=== Testing Template Approval Workflow ===');
        for (const template of createdTemplates) {
            // Update status to approved
            const approvedTemplate = await Template.findByIdAndUpdate(
                template._id,
                { status: 'approved' },
                { new: true }
            );
            console.log(`Template ${approvedTemplate.name} status updated to: ${approvedTemplate.status}`);
        }

        // Test 4: Variable Replacement
        console.log('\n=== Testing Variable Replacement ===');
        for (const template of createdTemplates) {
            const variables = {};
            template.variables.forEach(varName => {
                variables[varName] = `test_${varName}`;
            });

            const replacedContent = template.content.replace(
                /{{([^}]+)}}/g,
                (match, varName) => variables[varName] || match
            );

            console.log(`\nTemplate: ${template.name}`);
            console.log('Original content:', template.content);
            console.log('Replaced content:', replacedContent);
        }

        // Test 5: Template Retrieval and Filtering
        console.log('\n=== Testing Template Retrieval ===');
        
        // Get all templates
        const allTemplates = await Template.find()
            .populate('category', 'name')
            .populate('userId', 'username');
        console.log('\nAll templates:', allTemplates.map(t => ({
            name: t.name,
            category: t.category.name,
            status: t.status,
            user: t.userId.username
        })));

        // Get templates by category
        for (const category of createdCategories) {
            const categoryTemplates = await Template.find({ category: category._id });
            console.log(`\nTemplates in category ${category.name}:`, categoryTemplates.map(t => t.name));
        }

        // Get templates by status
        for (const status of testData.statuses) {
            const statusTemplates = await Template.find({ status });
            console.log(`\nTemplates with status ${status}:`, statusTemplates.map(t => t.name));
        }

        // Test 6: Template Update
        console.log('\n=== Testing Template Update ===');
        for (const template of createdTemplates) {
            const updatedContent = `${template.content} Updated at ${new Date().toISOString()}`;
            const updatedTemplate = await Template.findByIdAndUpdate(
                template._id,
                { content: updatedContent },
                { new: true }
            );
            console.log(`Updated template ${updatedTemplate.name}`);
            console.log('New content:', updatedTemplate.content);
        }

        // Test 7: Template Deletion
        console.log('\n=== Testing Template Deletion ===');
        for (const template of createdTemplates) {
            await Template.findByIdAndDelete(template._id);
            console.log(`Deleted template: ${template.name}`);
        }

        // Test 8: Category Cleanup
        console.log('\n=== Cleaning up Categories ===');
        for (const category of createdCategories) {
            await Category.findByIdAndDelete(category._id);
            console.log(`Deleted category: ${category.name}`);
        }

        console.log('\nAll template management tests completed successfully!');

    } catch (error) {
        console.error('Error during testing:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

// Run the tests
testTemplateManagement(); 