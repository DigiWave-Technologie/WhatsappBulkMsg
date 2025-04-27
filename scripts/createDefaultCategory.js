const mongoose = require('mongoose');
const Category = require('../models/Category');
require('dotenv').config();

async function createDefaultCategory() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Create or update Default category
        const defaultCategory = await Category.findOneAndUpdate(
            { name: 'Default' },
            {
                name: 'Default',
                description: 'Default credit category for general usage',
                creditCost: 1,
                isActive: true
            },
            { upsert: true, new: true }
        );

        console.log('Default category:', defaultCategory);

    } catch (error) {
        console.error('Error creating default category:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

createDefaultCategory(); 