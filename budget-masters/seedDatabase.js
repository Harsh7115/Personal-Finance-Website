// seedDatabase.js
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Budget = require('./src/models/Budget');
const Expense = require('./src/models/Expense');

require('dotenv').config();

const testUsers = [
    { username: 'sarah_saver', targetSavings: 0.35 },
    { username: 'budget_master', targetSavings: 0.30 },
    { username: 'money_wise', targetSavings: 0.25 },
    { username: 'smart_spender', targetSavings: 0.20 },
    { username: 'frugal_fred', targetSavings: 0.15 }
];

const categories = ['Groceries', 'Rent', 'Utilities', 'Entertainment', 'Transportation'];

// Verification function definition
async function verifySeeding() {
    try {
        const users = await User.find();
        console.log('\nVerifying seeded data:');
        console.log('Total users created:', users.length);
        
        for (const user of users) {
            console.log(`\nUser: ${user.username}`);
            console.log('Total Savings:', user.totalSavings);
            console.log('Savings Percentage:', user.savingsPercentage);
            
            const budgets = await Budget.find({ userId: user._id });
            console.log('Number of budgets:', budgets.length);
            
            for (const budget of budgets) {
                const expenses = await Expense.find({ budgetId: budget._id });
                console.log(`Budget "${budget.name}" has ${expenses.length} expenses`);
            }
        }
    } catch (error) {
        console.error('Verification failed:', error);
    }
}

async function seedDatabase() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/budget-masters');
        console.log('Connected to MongoDB');

        // Clear existing data
        await User.deleteMany({});
        await Budget.deleteMany({});
        await Expense.deleteMany({});

        // Create users with budgets and expenses
        for (const userData of testUsers) {
            // Create user
            const user = await User.create({
                username: userData.username,
                totalSavings: 0,
                savingsPercentage: 0
            });

            // Create budget
            const totalBudget = 5000; // Monthly budget
            const budget = await Budget.create({
                userId: user._id,
                name: 'Monthly Budget',
                categories: categories.map(category => ({
                    name: category,
                    limit: totalBudget / categories.length,
                    spent: 0
                })),
                totalLimit: totalBudget,
                totalSpent: 0
            });

            // Add budget reference to user
            user.budgets.push(budget._id);
            await user.save();

            // Create expenses for the past 3 months
            const now = new Date();
            for (let month = 0; month < 3; month++) {
                for (const category of categories) {
                    const targetSpending = (totalBudget / categories.length) * (1 - userData.targetSavings);
                    const randomSpent = targetSpending * (0.8 + Math.random() * 0.4); // Random amount around target

                    const expense = await Expense.create({
                        budgetId: budget._id,
                        category: category,
                        amount: randomSpent,
                        date: new Date(now.getFullYear(), now.getMonth() - month, Math.floor(Math.random() * 28) + 1),
                        description: `${category} expense`
                    });

                    // Update budget category spent amount
                    const categoryIndex = budget.categories.findIndex(c => c.name === category);
                    budget.categories[categoryIndex].spent += randomSpent;
                    budget.totalSpent += randomSpent;
                }
            }

            // Update budget
            await budget.save();

            // Update user savings
            const savingsAmount = totalBudget - budget.totalSpent;
            const savingsPercentage = (savingsAmount / totalBudget) * 100;

            user.totalSavings = savingsAmount;
            user.savingsPercentage = savingsPercentage;
            await user.save();

            console.log(`Created test data for user: ${userData.username}`);
        }

        // Call verifySeeding after all users are created
        await verifySeeding();

        console.log('Database seeding completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
}

seedDatabase();