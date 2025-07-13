const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  telegramId: {
    type: Number,
    required: true,
    unique: true,
    index: true
  },
  username: {
    type: String,
    required: true
  },
  firstName: {
    type: String,
    default: ''
  },
  lastName: {
    type: String,
    default: ''
  },
  referralCode: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  referredBy: {
    type: Number,
    default: null
  },
  referredUsers: [{
    type: Number
  }],
  referralCount: {
    type: Number,
    default: 0
  },
  walletBalance: {
    type: Number,
    default: 0
  },
  totalEarned: {
    type: Number,
    default: 0
  },
  upiId: {
    type: String,
    default: ''
  },
  isSubscribed: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  lastActiveAt: {
    type: Date,
    default: Date.now
  },
  awaitingUpiId: {
    type: Boolean,
    default: false
  },
  totalWithdrawn: {
    type: Number,
    default: 0
  },
  withdrawalCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for better performance
userSchema.index({ telegramId: 1 });
userSchema.index({ referralCode: 1 });
userSchema.index({ referredBy: 1 });
userSchema.index({ isSubscribed: 1 });
userSchema.index({ joinedAt: -1 });

// Virtual for total earnings
userSchema.virtual('totalPotentialEarnings').get(function() {
  return this.referralCount * (process.env.REFERRAL_REWARD || 5);
});

// Method to add referral
userSchema.methods.addReferral = function(referredUserId) {
  if (!this.referredUsers.includes(referredUserId)) {
    this.referredUsers.push(referredUserId);
    this.referralCount += 1;
    this.walletBalance += parseInt(process.env.REFERRAL_REWARD || 5);
    this.totalEarned += parseInt(process.env.REFERRAL_REWARD || 5);
  }
};

// Method to process withdrawal
userSchema.methods.processWithdrawal = function(amount) {
  if (this.walletBalance >= amount) {
    this.walletBalance -= amount;
    this.totalWithdrawn += amount;
    this.withdrawalCount += 1;
    return true;
  }
  return false;
};

// Static method to get user stats
userSchema.statics.getStats = async function() {
  const totalUsers = await this.countDocuments();
  const activeUsers = await this.countDocuments({ isActive: true });
  const subscribedUsers = await this.countDocuments({ isSubscribed: true });
  const totalReferrals = await this.aggregate([
    { $group: { _id: null, total: { $sum: '$referralCount' } } }
  ]);
  const totalEarnings = await this.aggregate([
    { $group: { _id: null, total: { $sum: '$totalEarned' } } }
  ]);
  const totalWithdrawals = await this.aggregate([
    { $group: { _id: null, total: { $sum: '$totalWithdrawn' } } }
  ]);

  return {
    totalUsers,
    activeUsers,
    subscribedUsers,
    totalReferrals: totalReferrals[0]?.total || 0,
    totalEarnings: totalEarnings[0]?.total || 0,
    totalWithdrawals: totalWithdrawals[0]?.total || 0
  };
};

module.exports = mongoose.model('User', userSchema);

