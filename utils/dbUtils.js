const fs = require('fs').promises;
const path = require('path');

// JSON file storage as fallback
const DATA_DIR = path.join(__dirname, '../data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const WITHDRAWALS_FILE = path.join(DATA_DIR, 'withdrawals.json');

class JSONStorage {
  constructor() {
    this.ensureDataDir();
  }

  async ensureDataDir() {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
    } catch (error) {
      console.error('Error creating data directory:', error);
    }
  }

  async readFile(filePath) {
    try {
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return [];
    }
  }

  async writeFile(filePath, data) {
    try {
      await fs.writeFile(filePath, JSON.stringify(data, null, 2));
      return true;
    } catch (error) {
      console.error('Error writing file:', error);
      return false;
    }
  }

  // User operations
  async getUsers() {
    return await this.readFile(USERS_FILE);
  }

  async saveUsers(users) {
    return await this.writeFile(USERS_FILE, users);
  }

  async findUser(telegramId) {
    const users = await this.getUsers();
    return users.find(user => user.telegramId === telegramId);
  }

  async saveUser(userData) {
    const users = await this.getUsers();
    const existingIndex = users.findIndex(user => user.telegramId === userData.telegramId);
    
    if (existingIndex !== -1) {
      users[existingIndex] = { ...users[existingIndex], ...userData, updatedAt: new Date() };
    } else {
      users.push({ ...userData, createdAt: new Date(), updatedAt: new Date() });
    }
    
    return await this.saveUsers(users);
  }

  // Withdrawal operations
  async getWithdrawals() {
    return await this.readFile(WITHDRAWALS_FILE);
  }

  async saveWithdrawals(withdrawals) {
    return await this.writeFile(WITHDRAWALS_FILE, withdrawals);
  }

  async saveWithdrawal(withdrawalData) {
    const withdrawals = await this.getWithdrawals();
    const withdrawalId = Date.now().toString();
    const newWithdrawal = { 
      id: withdrawalId, 
      ...withdrawalData, 
      createdAt: new Date(), 
      updatedAt: new Date() 
    };
    
    withdrawals.push(newWithdrawal);
    await this.saveWithdrawals(withdrawals);
    return newWithdrawal;
  }

  async updateWithdrawal(withdrawalId, updateData) {
    const withdrawals = await this.getWithdrawals();
    const index = withdrawals.findIndex(w => w.id === withdrawalId);
    
    if (index !== -1) {
      withdrawals[index] = { ...withdrawals[index], ...updateData, updatedAt: new Date() };
      await this.saveWithdrawals(withdrawals);
      return withdrawals[index];
    }
    
    return null;
  }

  // Statistics
  async getUserStats() {
    const users = await this.getUsers();
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.isActive).length;
    const subscribedUsers = users.filter(u => u.isSubscribed).length;
    const totalReferrals = users.reduce((sum, u) => sum + (u.referralCount || 0), 0);
    const totalEarnings = users.reduce((sum, u) => sum + (u.totalEarned || 0), 0);
    const totalWithdrawals = users.reduce((sum, u) => sum + (u.totalWithdrawn || 0), 0);

    return {
      totalUsers,
      activeUsers,
      subscribedUsers,
      totalReferrals,
      totalEarnings,
      totalWithdrawals
    };
  }

  async getWithdrawalStats() {
    const withdrawals = await this.getWithdrawals();
    const totalRequests = withdrawals.length;
    const pendingRequests = withdrawals.filter(w => w.status === 'pending').length;
    const approvedRequests = withdrawals.filter(w => w.status === 'approved').length;
    const completedRequests = withdrawals.filter(w => w.status === 'completed').length;
    const rejectedRequests = withdrawals.filter(w => w.status === 'rejected').length;
    
    const totalAmount = withdrawals.reduce((sum, w) => sum + (w.amount || 0), 0);
    const pendingAmount = withdrawals.filter(w => w.status === 'pending').reduce((sum, w) => sum + (w.amount || 0), 0);
    const completedAmount = withdrawals.filter(w => w.status === 'completed').reduce((sum, w) => sum + (w.amount || 0), 0);

    return {
      totalRequests,
      pendingRequests,
      approvedRequests,
      completedRequests,
      rejectedRequests,
      totalAmount,
      pendingAmount,
      completedAmount
    };
  }
}

// Referral validation utilities
class ReferralValidator {
  static validateReferral(referrerUserId, newUserId) {
    // Prevent self-referral
    if (referrerUserId === newUserId) {
      return { valid: false, reason: 'Self-referral not allowed' };
    }

    // Additional validation can be added here
    return { valid: true };
  }

  static generateReferralCode(userId) {
    const crypto = require('crypto');
    return crypto.createHash('md5').update(userId.toString()).digest('hex').substring(0, 8);
  }

  static async checkDuplicateReferral(referrerUserId, newUserId, storage) {
    if (storage instanceof JSONStorage) {
      const users = await storage.getUsers();
      const referrer = users.find(u => u.telegramId === referrerUserId);
      return referrer && referrer.referredUsers && referrer.referredUsers.includes(newUserId);
    } else {
      // MongoDB check
      const User = require('../models/User');
      const referrer = await User.findOne({ telegramId: referrerUserId });
      return referrer && referrer.referredUsers.includes(newUserId);
    }
  }
}

// Database helper functions
const dbHelpers = {
  // Get storage instance (MongoDB or JSON)
  getStorage() {
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState === 1) {
      return 'mongodb';
    } else {
      return new JSONStorage();
    }
  },

  // Universal user operations
  async findUser(telegramId) {
    const storage = this.getStorage();
    if (storage === 'mongodb') {
      const User = require('../models/User');
      return await User.findOne({ telegramId });
    } else {
      return await storage.findUser(telegramId);
    }
  },

  async saveUser(userData) {
    const storage = this.getStorage();
    if (storage === 'mongodb') {
      const User = require('../models/User');
      return await User.findOneAndUpdate(
        { telegramId: userData.telegramId },
        userData,
        { upsert: true, new: true }
      );
    } else {
      return await storage.saveUser(userData);
    }
  },

  // Universal withdrawal operations
  async saveWithdrawal(withdrawalData) {
    const storage = this.getStorage();
    if (storage === 'mongodb') {
      const Withdrawal = require('../models/Withdrawal');
      const withdrawal = new Withdrawal(withdrawalData);
      return await withdrawal.save();
    } else {
      return await storage.saveWithdrawal(withdrawalData);
    }
  },

  // Universal stats
  async getStats() {
    const storage = this.getStorage();
    if (storage === 'mongodb') {
      const User = require('../models/User');
      const Withdrawal = require('../models/Withdrawal');
      const userStats = await User.getStats();
      const withdrawalStats = await Withdrawal.getStats();
      return { ...userStats, ...withdrawalStats };
    } else {
      const userStats = await storage.getUserStats();
      const withdrawalStats = await storage.getWithdrawalStats();
      return { ...userStats, ...withdrawalStats };
    }
  }
};

module.exports = {
  JSONStorage,
  ReferralValidator,
  dbHelpers
};

