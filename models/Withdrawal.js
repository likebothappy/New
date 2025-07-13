const mongoose = require('mongoose');

const withdrawalSchema = new mongoose.Schema({
  userId: {
    type: Number,
    required: true,
    index: true
  },
  username: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  upiId: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed'],
    default: 'pending',
    index: true
  },
  requestedAt: {
    type: Date,
    default: Date.now
  },
  processedAt: {
    type: Date,
    default: null
  },
  processedBy: {
    type: String,
    default: null
  },
  adminNotes: {
    type: String,
    default: ''
  },
  transactionId: {
    type: String,
    default: ''
  },
  rejectionReason: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Indexes for better performance
withdrawalSchema.index({ userId: 1 });
withdrawalSchema.index({ status: 1 });
withdrawalSchema.index({ requestedAt: -1 });
withdrawalSchema.index({ processedAt: -1 });

// Static method to get withdrawal stats
withdrawalSchema.statics.getStats = async function() {
  const totalRequests = await this.countDocuments();
  const pendingRequests = await this.countDocuments({ status: 'pending' });
  const approvedRequests = await this.countDocuments({ status: 'approved' });
  const completedRequests = await this.countDocuments({ status: 'completed' });
  const rejectedRequests = await this.countDocuments({ status: 'rejected' });
  
  const totalAmount = await this.aggregate([
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
  
  const pendingAmount = await this.aggregate([
    { $match: { status: 'pending' } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
  
  const completedAmount = await this.aggregate([
    { $match: { status: 'completed' } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);

  return {
    totalRequests,
    pendingRequests,
    approvedRequests,
    completedRequests,
    rejectedRequests,
    totalAmount: totalAmount[0]?.total || 0,
    pendingAmount: pendingAmount[0]?.total || 0,
    completedAmount: completedAmount[0]?.total || 0
  };
};

// Method to approve withdrawal
withdrawalSchema.methods.approve = function(adminUsername, transactionId = '', notes = '') {
  this.status = 'approved';
  this.processedAt = new Date();
  this.processedBy = adminUsername;
  this.transactionId = transactionId;
  this.adminNotes = notes;
};

// Method to complete withdrawal
withdrawalSchema.methods.complete = function(adminUsername, transactionId = '', notes = '') {
  this.status = 'completed';
  this.processedAt = new Date();
  this.processedBy = adminUsername;
  this.transactionId = transactionId;
  this.adminNotes = notes;
};

// Method to reject withdrawal
withdrawalSchema.methods.reject = function(adminUsername, reason = '', notes = '') {
  this.status = 'rejected';
  this.processedAt = new Date();
  this.processedBy = adminUsername;
  this.rejectionReason = reason;
  this.adminNotes = notes;
};

module.exports = mongoose.model('Withdrawal', withdrawalSchema);

