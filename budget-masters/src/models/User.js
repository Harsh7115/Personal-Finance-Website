// src/models/User.js
// Contributors: Harshit Jain, Ashish Dev Choudhary, Shivansh Singh, Advik Bargoti
// Model set up for User data with Mongoose
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    budgets: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Budget'
    }],
    totalSavings: {
        type: Number,
        default: 0
    },
    savingsPercentage: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('User', userSchema);