// src/routes/budgets.js
// Contributors: Harshit Jain, Ashish Dev Choudhary, Shivansh Singh, Advik Bargoti
// Sets up Budget Functionality

const express = require('express');
const router = express.Router();
const Budget = require('../models/Budget');
const User = require('../models/User');
const Expense = require('../models/Expense');

// Get budgets for a user
router.get('/:userId', async (req, res) => {
    try {
        const budgets = await Budget.find({ userId: req.params.userId });
        
        // For each budget, get its expenses
        const budgetsWithExpenses = await Promise.all(budgets.map(async (budget) => {
            const expenses = await Expense.find({ budgetId: budget._id });
            return {
                ...budget.toObject(),
                expenses
            };
        }));

        res.json({ success: true, budgets: budgetsWithExpenses });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Create new budget
router.post('/', async (req, res) => {
    try {
        const { userId, name, categories, limit } = req.body;
        
        // Create budget with categories array
        const budget = await Budget.create({
            userId,
            name,
            categories: categories.map(category => ({
                name: category,
                limit: limit / categories.length, // Divide total limit equally among categories
                spent: 0
            })),
            totalLimit: limit,
            totalSpent: 0
        });

        // Add budget reference to user
        await User.findByIdAndUpdate(userId, {
            $push: { budgets: budget._id }
        });

        res.json({ success: true, budget });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update budget
router.put('/:id', async (req, res) => {
    try {
        const { name, categories, limit } = req.body;
        
        const budget = await Budget.findByIdAndUpdate(
            req.params.id,
            {
                name,
                categories: categories.map(category => ({
                    name: category,
                    limit: limit / categories.length,
                    spent: 0
                })),
                totalLimit: limit
            },
            { new: true }
        );

        if (!budget) {
            return res.status(404).json({ success: false, message: 'Budget not found' });
        }

        res.json({ success: true, budget });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Delete budget
router.delete('/:id', async (req, res) => {
    try {
        const budget = await Budget.findById(req.params.id);
        if (!budget) {
            return res.status(404).json({ success: false, message: 'Budget not found' });
        }

        // Delete all associated expenses
        await Expense.deleteMany({ budgetId: budget._id });

        // Remove budget reference from user
        await User.findByIdAndUpdate(budget.userId, {
            $pull: { budgets: budget._id }
        });

        // Delete the budget
        await Budget.findByIdAndDelete(req.params.id);

        res.json({ success: true, message: 'Budget deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get single budget with expenses
router.get('/single/:budgetId', async (req, res) => {
    try {
        const budget = await Budget.findById(req.params.budgetId);
        if (!budget) {
            return res.status(404).json({ success: false, message: 'Budget not found' });
        }

        const expenses = await Expense.find({ budgetId: budget._id });
        
        res.json({
            success: true,
            budget: {
                ...budget.toObject(),
                expenses
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;