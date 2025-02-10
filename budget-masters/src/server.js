// src/server.js
// Contributors: Harshit Jain, Ashish Dev Choudhary, Shivansh Singh, Advik Bargoti
// Sets up Budget Functionality
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const User = require('./models/User');
const Budget = require('./models/Budget');
const Expense = require('./models/Expense');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../public')));

// Modified database connection with async initialization
async function startServer() {
    try {
        // Connect to MongoDB first
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/budget-masters');
        console.log('✅ MongoDB connected successfully');

        // Routes
        app.use('/api/users', require('./routes/users'));
        app.use('/api/budgets', require('./routes/budgets'));
        app.use('/api/expenses', require('./routes/expenses'));

        app.get('/api/leaderboard', async (req, res) => {
            try {
                const { username, timeRange } = req.query;
                
                // Get all users
                const users = await User.find();
                
                if (!users || users.length === 0) {
                    return res.json({ 
                        success: true, 
                        leaderboard: [],
                        userStats: {
                            rank: 0,
                            totalSavings: 0,
                            savingsPercentage: 0
                        }
                    });
                }
        
                // Sort users by savings percentage
                const leaderboard = users.map(user => ({
                    username: user.username,
                    totalSavings: user.totalSavings || 0,
                    savingsPercentage: user.savingsPercentage || 0
                })).sort((a, b) => b.savingsPercentage - a.savingsPercentage);
        
                // Find current user's rank and stats
                const userIndex = leaderboard.findIndex(user => user.username === username);
                const userStats = {
                    rank: userIndex !== -1 ? userIndex + 1 : 0,
                    totalSavings: userIndex !== -1 ? leaderboard[userIndex].totalSavings : 0,
                    savingsPercentage: userIndex !== -1 ? leaderboard[userIndex].savingsPercentage : 0
                };
        
                res.json({ 
                    success: true, 
                    leaderboard,
                    userStats
                });
            } catch (error) {
                console.error('Error in leaderboard:', error);
                res.status(500).json({ 
                    success: false, 
                    message: 'Failed to load leaderboard',
                    error: error.message 
                });
            }
        });

        // Catch-all route handler for client-side routing
        app.get('*', (req, res) => {
            res.sendFile(path.join(__dirname, '../public/index.html'));
        });

        // Start server after successful database connection
        const PORT = 3000;  // Changed from process.env.PORT || 3000 to 80
        app.listen(PORT, () => {
            console.log(`🚀 Server is running on port ${PORT}`);
            console.log('💾 MongoDB Status:', mongoose.connection.readyState === 1 ? 'Connected' : 'Not connected');
        });

    } catch (error) {
        console.error('❌ Server startup error:', error);
        process.exit(1);
    }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (error) => {
    console.error('Unhandled Rejection:', error);
    process.exit(1);
});

// Start the server
startServer();