const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

// Import models
const User = require('../models/User');
const Withdrawal = require('../models/Withdrawal');

// Import utilities
const { dbHelpers } = require('../utils/dbUtils');

const router = express.Router();

// Middleware to verify admin token
const verifyAdminToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        req.admin = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};

// Admin login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }
        
        // Check credentials
        const adminUsername = process.env.ADMIN_USERNAME || 'youbtech';
        const adminPassword = process.env.ADMIN_PASSWORD || 'youbtech';
        
        if (username !== adminUsername || password !== adminPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Generate JWT token
        const token = jwt.sign(
            { username: adminUsername, role: 'admin' },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );
        
        res.json({
            success: true,
            token,
            admin: { username: adminUsername }
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Get dashboard statistics
router.get('/stats', verifyAdminToken, async (req, res) => {
    try {
        let stats;
        
        if (mongoose.connection.readyState === 1) {
            // MongoDB is connected
            const userStats = await User.getStats();
            const withdrawalStats = await Withdrawal.getStats();
            stats = { ...userStats, ...withdrawalStats };
        } else {
            // Use JSON storage fallback
            stats = await dbHelpers.getStats();
        }
        
        res.json(stats);
        
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

// Get all users
router.get('/users', verifyAdminToken, async (req, res) => {
    try {
        let users;
        
        if (mongoose.connection.readyState === 1) {
            users = await User.find({})
                .sort({ joinedAt: -1 })
                .limit(100);
        } else {
            const { JSONStorage } = require('../utils/dbUtils');
            const storage = new JSONStorage();
            users = await storage.getUsers();
            users.sort((a, b) => new Date(b.joinedAt) - new Date(a.joinedAt));
        }
        
        res.json(users);
        
    } catch (error) {
        console.error('Users fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Get specific user
router.get('/users/:userId', verifyAdminToken, async (req, res) => {
    try {
        const { userId } = req.params;
        let user;
        
        if (mongoose.connection.readyState === 1) {
            user = await User.findOne({ telegramId: parseInt(userId) });
        } else {
            user = await dbHelpers.findUser(parseInt(userId));
        }
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json(user);
        
    } catch (error) {
        console.error('User fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

// Update user balance
router.put('/users/:userId/balance', verifyAdminToken, async (req, res) => {
    try {
        const { userId } = req.params;
        const { balance } = req.body;
        
        if (typeof balance !== 'number' || balance < 0) {
            return res.status(400).json({ error: 'Invalid balance amount' });
        }
        
        let user;
        
        if (mongoose.connection.readyState === 1) {
            user = await User.findOneAndUpdate(
                { telegramId: parseInt(userId) },
                { walletBalance: balance },
                { new: true }
            );
        } else {
            user = await dbHelpers.findUser(parseInt(userId));
            if (user) {
                user.walletBalance = balance;
                await dbHelpers.saveUser(user);
            }
        }
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json({ success: true, user });
        
    } catch (error) {
        console.error('Balance update error:', error);
        res.status(500).json({ error: 'Failed to update balance' });
    }
});

// Update user status
router.put('/users/:userId/status', verifyAdminToken, async (req, res) => {
    try {
        const { userId } = req.params;
        const { isActive } = req.body;
        
        let user;
        
        if (mongoose.connection.readyState === 1) {
            user = await User.findOneAndUpdate(
                { telegramId: parseInt(userId) },
                { isActive: Boolean(isActive) },
                { new: true }
            );
        } else {
            user = await dbHelpers.findUser(parseInt(userId));
            if (user) {
                user.isActive = Boolean(isActive);
                await dbHelpers.saveUser(user);
            }
        }
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json({ success: true, user });
        
    } catch (error) {
        console.error('Status update error:', error);
        res.status(500).json({ error: 'Failed to update status' });
    }
});

// Get all withdrawals
router.get('/withdrawals', verifyAdminToken, async (req, res) => {
    try {
        let withdrawals;
        
        if (mongoose.connection.readyState === 1) {
            withdrawals = await Withdrawal.find({})
                .sort({ requestedAt: -1 })
                .limit(100);
        } else {
            const { JSONStorage } = require('../utils/dbUtils');
            const storage = new JSONStorage();
            withdrawals = await storage.getWithdrawals();
            withdrawals.sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt));
        }
        
        res.json(withdrawals);
        
    } catch (error) {
        console.error('Withdrawals fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch withdrawals' });
    }
});

// Process withdrawal (approve/reject)
router.put('/withdrawals/:withdrawalId/:action', verifyAdminToken, async (req, res) => {
    try {
        const { withdrawalId, action } = req.params;
        const { notes, transactionId } = req.body;
        
        if (!['approve', 'reject', 'complete'].includes(action)) {
            return res.status(400).json({ error: 'Invalid action' });
        }
        
        let withdrawal;
        let user;
        
        if (mongoose.connection.readyState === 1) {
            withdrawal = await Withdrawal.findById(withdrawalId);
            if (!withdrawal) {
                return res.status(404).json({ error: 'Withdrawal not found' });
            }
            
            user = await User.findOne({ telegramId: withdrawal.userId });
            
            if (action === 'approve') {
                withdrawal.approve(req.admin.username, transactionId, notes);
            } else if (action === 'reject') {
                withdrawal.reject(req.admin.username, notes, notes);
                // Restore balance to user if rejected
                if (user) {
                    user.walletBalance += withdrawal.amount;
                    await user.save();
                }
            } else if (action === 'complete') {
                withdrawal.complete(req.admin.username, transactionId, notes);
                // Deduct balance from user
                if (user && user.walletBalance >= withdrawal.amount) {
                    user.processWithdrawal(withdrawal.amount);
                    await user.save();
                }
            }
            
            await withdrawal.save();
            
        } else {
            // JSON storage implementation
            const { JSONStorage } = require('../utils/dbUtils');
            const storage = new JSONStorage();
            
            const withdrawals = await storage.getWithdrawals();
            const withdrawalIndex = withdrawals.findIndex(w => w.id === withdrawalId);
            
            if (withdrawalIndex === -1) {
                return res.status(404).json({ error: 'Withdrawal not found' });
            }
            
            withdrawal = withdrawals[withdrawalIndex];
            user = await storage.findUser(withdrawal.userId);
            
            if (action === 'approve') {
                withdrawal.status = 'approved';
            } else if (action === 'reject') {
                withdrawal.status = 'rejected';
                withdrawal.rejectionReason = notes;
                // Restore balance
                if (user) {
                    user.walletBalance += withdrawal.amount;
                    await storage.saveUser(user);
                }
            } else if (action === 'complete') {
                withdrawal.status = 'completed';
                // Deduct balance
                if (user && user.walletBalance >= withdrawal.amount) {
                    user.walletBalance -= withdrawal.amount;
                    user.totalWithdrawn += withdrawal.amount;
                    user.withdrawalCount += 1;
                    await storage.saveUser(user);
                }
            }
            
            withdrawal.processedAt = new Date();
            withdrawal.processedBy = req.admin.username;
            withdrawal.adminNotes = notes;
            withdrawal.transactionId = transactionId;
            
            await storage.saveWithdrawals(withdrawals);
        }
        
        // Notify user via bot
        try {
            const bot = require('../src/bot');
            let message;
            
            if (action === 'approve') {
                message = `✅ Your withdrawal request of ₹${withdrawal.amount} has been approved!\n\n` +
                         `💳 UPI ID: ${withdrawal.upiId}\n` +
                         `📅 Processed: ${new Date().toLocaleDateString()}\n` +
                         `🆔 Transaction ID: ${transactionId || 'N/A'}\n\n` +
                         `💰 Payment will be processed within 24 hours.`;
            } else if (action === 'reject') {
                message = `❌ Your withdrawal request of ₹${withdrawal.amount} has been rejected.\n\n` +
                         `📝 Reason: ${notes}\n` +
                         `💰 Amount has been restored to your wallet.\n\n` +
                         `📞 Contact @youbtech for assistance.`;
            } else if (action === 'complete') {
                message = `🎉 Your withdrawal of ₹${withdrawal.amount} has been completed!\n\n` +
                         `💳 UPI ID: ${withdrawal.upiId}\n` +
                         `🆔 Transaction ID: ${transactionId || 'N/A'}\n` +
                         `📅 Completed: ${new Date().toLocaleDateString()}\n\n` +
                         `💰 Payment has been sent to your UPI ID.`;
            }
            
            await bot.sendMessage(withdrawal.userId, message);
        } catch (botError) {
            console.error('Bot notification error:', botError);
        }
        
        res.json({ success: true, withdrawal });
        
    } catch (error) {
        console.error('Withdrawal processing error:', error);
        res.status(500).json({ error: 'Failed to process withdrawal' });
    }
});

// Get withdrawal by ID
router.get('/withdrawals/:withdrawalId', verifyAdminToken, async (req, res) => {
    try {
        const { withdrawalId } = req.params;
        let withdrawal;
        
        if (mongoose.connection.readyState === 1) {
            withdrawal = await Withdrawal.findById(withdrawalId);
        } else {
            const { JSONStorage } = require('../utils/dbUtils');
            const storage = new JSONStorage();
            const withdrawals = await storage.getWithdrawals();
            withdrawal = withdrawals.find(w => w.id === withdrawalId);
        }
        
        if (!withdrawal) {
            return res.status(404).json({ error: 'Withdrawal not found' });
        }
        
        res.json(withdrawal);
        
    } catch (error) {
        console.error('Withdrawal fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch withdrawal' });
    }
});

// Export users data
router.get('/export/users', verifyAdminToken, async (req, res) => {
    try {
        let users;
        
        if (mongoose.connection.readyState === 1) {
            users = await User.find({}).sort({ joinedAt: -1 });
        } else {
            const { JSONStorage } = require('../utils/dbUtils');
            const storage = new JSONStorage();
            users = await storage.getUsers();
        }
        
        // Convert to CSV format
        const csvHeader = 'Telegram ID,Username,Referral Code,Referrals,Balance,UPI ID,Joined Date,Status\n';
        const csvData = users.map(user => 
            `${user.telegramId},"${user.username || ''}","${user.referralCode || ''}",${user.referralCount || 0},${user.walletBalance || 0},"${user.upiId || ''}","${new Date(user.joinedAt).toISOString()}","${user.isActive ? 'Active' : 'Inactive'}"`
        ).join('\n');
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=users.csv');
        res.send(csvHeader + csvData);
        
    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ error: 'Failed to export users' });
    }
});

// Analytics endpoint
router.get('/analytics', verifyAdminToken, async (req, res) => {
    try {
        let analytics = {
            userGrowth: [],
            withdrawalTrends: [],
            referralStats: []
        };
        
        // This is a simplified analytics implementation
        // In a real application, you would calculate actual growth data
        
        res.json(analytics);
        
    } catch (error) {
        console.error('Analytics error:', error);
        res.status(500).json({ error: 'Failed to fetch analytics' });
    }
});

module.exports = router;

