// src/routes/expenses.js
// Contributors: Harshit Jain, Ashish Dev Choudhary, Shivansh Singh, Advik Bargoti
// Sets up Expenses Functionality
const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const Budget = require('../models/Budget');

// Get expenses for a specific budget
router.get('/budget/:budgetId', async (req, res) => {
    try {
        const expenses = await Expense.find({ budgetId: req.params.budgetId });
        res.json({ success: true, expenses });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Add new expense
router.post('/', async (req, res) => {
    try {
        const { budgetId, category, amount, date, description } = req.body;
        
        // Create the expense
        const expense = await Expense.create({
            budgetId,
            category,
            amount,
            date,
            description
        });

        // Update budget totals
        const budget = await Budget.findById(budgetId);
        if (budget) {
            const categoryIndex = budget.categories.findIndex(c => c.name === category);
            if (categoryIndex !== -1) {
                budget.categories[categoryIndex].spent += amount;
                budget.totalSpent += amount;
                await budget.save();
            }
        }

        res.json({ success: true, expense });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update expense
router.put('/:id', async (req, res) => {
    try {
        const oldExpense = await Expense.findById(req.params.id);
        if (!oldExpense) {
            return res.status(404).json({ success: false, message: 'Expense not found' });
        }

        // Get the old values before updating
        const oldAmount = oldExpense.amount;
        const oldCategory = oldExpense.category;

        // Update the expense
        const { amount, category, description, date } = req.body;
        const updatedExpense = await Expense.findByIdAndUpdate(
            req.params.id,
            { amount, category, description, date },
            { new: true }
        );

        // Update budget totals
        const budget = await Budget.findById(oldExpense.budgetId);
        if (budget) {
            // Remove old amount from old category
            const oldCategoryIndex = budget.categories.findIndex(c => c.name === oldCategory);
            if (oldCategoryIndex !== -1) {
                budget.categories[oldCategoryIndex].spent -= oldAmount;
            }

            // Add new amount to new category
            const newCategoryIndex = budget.categories.findIndex(c => c.name === category);
            if (newCategoryIndex !== -1) {
                budget.categories[newCategoryIndex].spent += amount;
            }

            // Update total spent
            budget.totalSpent = budget.totalSpent - oldAmount + amount;
            await budget.save();
        }

        res.json({ success: true, expense: updatedExpense });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Delete expense
router.delete('/:id', async (req, res) => {
    try {
        const expense = await Expense.findById(req.params.id);
        if (!expense) {
            return res.status(404).json({ success: false, message: 'Expense not found' });
        }

        // Update budget totals
        const budget = await Budget.findById(expense.budgetId);
        if (budget) {
            const categoryIndex = budget.categories.findIndex(c => c.name === expense.category);
            if (categoryIndex !== -1) {
                budget.categories[categoryIndex].spent -= expense.amount;
            }
            budget.totalSpent -= expense.amount;
            await budget.save();
        }

        await Expense.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Expense deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;