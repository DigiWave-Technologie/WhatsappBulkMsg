const mongoose = require('mongoose');
const { Credit } = require('../models/Credit');
const Category = require('../models/Category');
require('dotenv').config();

async function fixNullCategories() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Get the Default category
        const defaultCategory = await Category.findOne({ name: 'Default' });
        if (!defaultCategory) {
            throw new Error('Default category not found');
        }
        console.log('Found Default category:', defaultCategory);

        // Find all credits with null or undefined categoryId
        const nullCategoryCredits = await Credit.find({
            $or: [
                { categoryId: null },
                { categoryId: { $exists: false } }
            ]
        });
        console.log(`Found ${nullCategoryCredits.length} credits with missing category:`, nullCategoryCredits);

        // Update each credit to use the Default category
        for (const credit of nullCategoryCredits) {
            console.log('Processing credit:', credit);
            
            // Find if user already has credits in the Default category
            const existingCredit = await Credit.findOne({
                userId: credit.userId,
                categoryId: defaultCategory._id
            });
            console.log('Existing credit in Default category:', existingCredit);

            if (existingCredit) {
                // Add credits to existing category
                existingCredit.credit += credit.credit;
                await existingCredit.save();
                await Credit.deleteOne({ _id: credit._id });
                console.log(`Added ${credit.credit} credits to existing Default category for user ${credit.userId}`);
            } else {
                // Update credit to use Default category
                await Credit.updateOne(
                    { _id: credit._id },
                    { $set: { categoryId: defaultCategory._id } }
                );
                console.log(`Updated credit ${credit._id} to use Default category`);
            }
        }

        console.log('Finished fixing null categories');

    } catch (error) {
        console.error('Error fixing null categories:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

fixNullCategories(); 