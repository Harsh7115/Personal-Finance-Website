// src/routes/users.js
// Contributors: Harshit Jain, Ashish Dev Choudhary, Shivansh Singh, Advik Bargoti
// Sets up users Functionality

const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Login/Register route
router.post('/login', async (req, res) => {
    try {
        const { username } = req.body;
        
        // Find existing user or create new one
        let user = await User.findOne({ username });
        
        if (!user) {
            // Create new user if doesn't exist
            user = await User.create({ 
                username,
                totalSavings: 0,
                savingsPercentage: 0
            });
        }

        res.json({
            success: true,
            user: {
                id: user._id,
                username: user.username,
                totalSavings: user.totalSavings,
                savingsPercentage: user.savingsPercentage
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get user details
router.get('/:userId', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId)
            .populate('budgets');
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({
            success: true,
            user: {
                id: user._id,
                username: user.username,
                totalSavings: user.totalSavings,
                savingsPercentage: user.savingsPercentage,
                budgets: user.budgets
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get leaderboard
router.get('/leaderboard', async (req, res) => {
    try {
        const timeRange = req.query.timeRange || 'all';
        let dateFilter = {};

        const now = new Date();
        if (timeRange === 'month') {
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            dateFilter = { createdAt: { $gte: monthStart } };
        } else if (timeRange === 'year') {
            const yearStart = new Date(now.getFullYear(), 0, 1);
            dateFilter = { createdAt: { $gte: yearStart } };
        }

        const users = await User.find(dateFilter)
            .select('username totalSavings savingsPercentage')
            .sort({ savingsPercentage: -1 });

        // Get requesting user's stats
        const username = req.query.username;
        const userRank = users.findIndex(u => u.username === username) + 1;
        const userStats = users.find(u => u.username === username) || {
            totalSavings: 0,
            savingsPercentage: 0
        };

        res.json({ 
            success: true, 
            leaderboard: users,
            userStats: {
                rank: userRank,
                totalSavings: userStats.totalSavings,
                savingsPercentage: userStats.savingsPercentage
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update user savings
router.put('/:userId/savings', async (req, res) => {
    try {
        const { totalSavings, savingsPercentage } = req.body;
        
        const user = await User.findByIdAndUpdate(
            req.params.userId,
            { totalSavings, savingsPercentage },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({
            success: true,
            user: {
                id: user._id,
                username: user.username,
                totalSavings: user.totalSavings,
                savingsPercentage: user.savingsPercentage
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Delete user account
router.delete('/:userId', async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.userId);
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({ success: true, message: 'User account deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;