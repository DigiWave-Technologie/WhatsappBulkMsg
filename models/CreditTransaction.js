const mongoose = require('mongoose');

// Check if the model already exists
const CreditTransaction = mongoose.models.CreditTransaction || 
    mongoose.model('CreditTransaction', new mongoose.Schema({
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        type: {
            type: String,
            enum: ['add', 'deduct', 'purchase', 'refund'],
            required: true
        },
        amount: {
            type: Number,
            required: true
        },
        description: {
            type: String
        },
        referenceId: {
            type: String
        },
        metadata: {
            type: mongoose.Schema.Types.Mixed
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }));

module.exports = CreditTransaction; 