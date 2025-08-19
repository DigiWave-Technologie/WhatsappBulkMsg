const UserTrigger = require('../models/UserTrigger');
const MetaTemplate = require('../models/MetaTemplate');
const { ApiError } = require('../utils/ApiError');
const logger = require('../utils/logger');

// Create a new user trigger
exports.createTrigger = async (req, res) => {
    try {
        const { name, quick_reply, user_triggers, template, flow } = req.body;

        // Validate template exists
        const templateExists = await MetaTemplate.findById(template);
        if (!templateExists) {
            throw new ApiError(404, 'Template not found');
        }

        // Check if trigger with same name exists
        const existingTrigger = await UserTrigger.findOne({ name });
        if (existingTrigger) {
            throw new ApiError(400, 'Trigger with this name already exists');
        }

        const trigger = await UserTrigger.create({
            name,
            quick_reply,
            user_triggers,
            template,
            flow,
            created_by: req.user.userId
        });

        res.status(201).json({
            success: true,
            data: trigger
        });
    } catch (error) {
        logger.error('Error creating trigger:', error);
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
};

// Get all triggers with filters
exports.getTriggers = async (req, res) => {
    try {
        const { template, is_active, page = 1, limit = 10 } = req.query;

        const query = {};
        if (template) query.template = template;
        if (is_active !== undefined) query.is_active = is_active === 'true';

        const triggers = await UserTrigger.find(query)
            .populate('template', 'template_name language')
            .populate('flow', 'name')
            .populate('created_by', 'name email')
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });

        const total = await UserTrigger.countDocuments(query);

        res.status(200).json({
            success: true,
            data: triggers,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        logger.error('Error fetching triggers:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get trigger by ID
exports.getTriggerById = async (req, res) => {
    try {
        const trigger = await UserTrigger.findById(req.params.id)
            .populate('template', 'template_name language')
            .populate('flow', 'name')
            .populate('created_by', 'name email');

        if (!trigger) {
            throw new ApiError(404, 'Trigger not found');
        }

        res.status(200).json({
            success: true,
            data: trigger
        });
    } catch (error) {
        logger.error('Error fetching trigger:', error);
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
};

// Update trigger
exports.updateTrigger = async (req, res) => {
    try {
        const { name, quick_reply, user_triggers, template, flow, is_active } = req.body;

        const trigger = await UserTrigger.findById(req.params.id);

        if (!trigger) {
            throw new ApiError(404, 'Trigger not found');
        }

        // Validate template exists if provided
        if (template) {
            const templateExists = await MetaTemplate.findById(template);
            if (!templateExists) {
                throw new ApiError(404, 'Template not found');
            }
        }

        // Check if updating to a name that already exists
        if (name && name !== trigger.name) {
            const existingTrigger = await UserTrigger.findOne({
                name,
                _id: { $ne: trigger._id }
            });

            if (existingTrigger) {
                throw new ApiError(400, 'Trigger with this name already exists');
            }
        }

        // Update fields
        const updateFields = {
            name: name || trigger.name,
            quick_reply: quick_reply || trigger.quick_reply,
            user_triggers: user_triggers || trigger.user_triggers,
            template: template || trigger.template,
            flow: flow || trigger.flow,
            is_active: is_active !== undefined ? is_active : trigger.is_active,
            updated_by: req.user.userId
        };

        const updatedTrigger = await UserTrigger.findByIdAndUpdate(
            req.params.id,
            updateFields,
            { new: true, runValidators: true }
        ).populate('template', 'template_name language')
         .populate('flow', 'name')
         .populate('created_by', 'name email')
         .populate('updated_by', 'name email');

        res.status(200).json({
            success: true,
            data: updatedTrigger
        });
    } catch (error) {
        logger.error('Error updating trigger:', error);
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
};

// Delete trigger
exports.deleteTrigger = async (req, res) => {
    try {
        const trigger = await UserTrigger.findById(req.params.id);

        if (!trigger) {
            throw new ApiError(404, 'Trigger not found');
        }

        await trigger.remove();

        res.status(200).json({
            success: true,
            message: 'Trigger deleted successfully'
        });
    } catch (error) {
        logger.error('Error deleting trigger:', error);
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
}; 