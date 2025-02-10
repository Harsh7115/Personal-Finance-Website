// src/models/Budget.js
// Contributors: Harshit Jain, Ashish Dev Choudhary, Shivansh Singh, Advik Bargoti
// Model set up for Budget data with Mongoose
const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    categories: [{
        name: {
            type: String,
            required: true
        },
        limit: {
            type: Number,
            required: true
        },
        spent: {
            type: Number,
            default: 0
        }
    }],
    totalLimit: {
        type: Number,
        required: true
    },
    totalSpent: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Update category spent amount and total spent when an expense is added
budgetSchema.methods.updateSpentAmounts = async function(category, amount) {
    const categoryIndex = this.categories.findIndex(c => c.name === category);
    if (categoryIndex !== -1) {
        this.categories[categoryIndex].spent += amount;
        this.totalSpent += amount;
        await this.save();
    }
};

module.exports = mongoose.model('Budget', budgetSchema);