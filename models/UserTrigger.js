const mongoose = require('mongoose');

const userTriggerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    quick_reply: {
        type: String,
        required: true,
        trim: true
    },
    user_triggers: [{
        type: String,
        trim: true
    }],
    template: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'WhatsAppOfficialTemplate',
        required: true
    },
    flow: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Flow'
    },
    is_active: {
        type: Boolean,
        default: true
    },
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    updated_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Add indexes for better query performance
userTriggerSchema.index({ name: 1 }, { unique: true });
userTriggerSchema.index({ template: 1 });
userTriggerSchema.index({ is_active: 1 });

const UserTrigger = mongoose.model('UserTrigger', userTriggerSchema);

module.exports = UserTrigger; 