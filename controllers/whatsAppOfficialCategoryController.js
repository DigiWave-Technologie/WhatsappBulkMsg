const WhatsAppOfficialCategory = require('../models/WhatsAppOfficialCategory');
const WhatsAppOfficialTemplate = require('../models/WhatsAppOfficialTemplate');
const { ApiError } = require('../utils/ApiError');
const logger = require('../utils/logger');

// Create a new category
exports.createCategory = async (req, res) => {
    try {
        const { name, description, type } = req.body;

        // Check if category with same name exists
        const existingCategory = await WhatsAppOfficialCategory.findOne({ name });
        if (existingCategory) {
            throw new ApiError(400, 'Category with this name already exists');
        }

        const category = await WhatsAppOfficialCategory.create({
            name,
            description,
            type,
            created_by: req.user.userId
        });

        res.status(201).json({
            success: true,
            data: category
        });
    } catch (error) {
        logger.error('Error creating category:', error);
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
};

// Get all categories with filters
exports.getCategories = async (req, res) => {
    try {
        const { type, is_active, page = 1, limit = 10 } = req.query;

        const query = {};
        if (type) query.type = type;
        if (is_active !== undefined) query.is_active = is_active === 'true';

        const categories = await WhatsAppOfficialCategory.find(query)
            .populate('created_by', 'name email')
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });

        const total = await WhatsAppOfficialCategory.countDocuments(query);

        res.status(200).json({
            success: true,
            data: categories,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        logger.error('Error fetching categories:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get category by ID
exports.getCategoryById = async (req, res) => {
    try {
        const category = await WhatsAppOfficialCategory.findById(req.params.id)
            .populate('created_by', 'name email');

        if (!category) {
            throw new ApiError(404, 'Category not found');
        }

        res.status(200).json({
            success: true,
            data: category
        });
    } catch (error) {
        logger.error('Error fetching category:', error);
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
};

// Update category
exports.updateCategory = async (req, res) => {
    try {
        const { name, description, type, is_active } = req.body;

        const category = await WhatsAppOfficialCategory.findById(req.params.id);

        if (!category) {
            throw new ApiError(404, 'Category not found');
        }

        // Check if updating to a name that already exists
        if (name && name !== category.name) {
            const existingCategory = await WhatsAppOfficialCategory.findOne({
                name,
                _id: { $ne: category._id }
            });

            if (existingCategory) {
                throw new ApiError(400, 'Category with this name already exists');
            }
        }

        // Update fields
        const updateFields = {
            name: name || category.name,
            description: description !== undefined ? description : category.description,
            type: type || category.type,
            is_active: is_active !== undefined ? is_active : category.is_active,
            updated_by: req.user.userId
        };

        const updatedCategory = await WhatsAppOfficialCategory.findByIdAndUpdate(
            req.params.id,
            updateFields,
            { new: true, runValidators: true }
        ).populate('created_by', 'name email')
         .populate('updated_by', 'name email');

        res.status(200).json({
            success: true,
            data: updatedCategory
        });
    } catch (error) {
        logger.error('Error updating category:', error);
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
};

// Delete category
exports.deleteCategory = async (req, res) => {
    try {
        const category = await WhatsAppOfficialCategory.findById(req.params.id);

        if (!category) {
            throw new ApiError(404, 'Category not found');
        }

        // Check if category is in use
        const templateCount = await WhatsAppOfficialTemplate.countDocuments({ category: category._id });
        if (templateCount > 0) {
            throw new ApiError(400, 'Cannot delete category that is in use by templates');
        }

        await category.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Category deleted successfully'
        });
    } catch (error) {
        logger.error('Error deleting category:', error);
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
}; 