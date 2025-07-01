const mongoose = require('mongoose');

const credittypeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    // Add any other fields relevant to credittype
}, { timestamps: true });

const Credittype = mongoose.model('Credittype', credittypeSchema);

module.exports = Credittype;