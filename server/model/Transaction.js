const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  orderId: { type: String, required: true },
  paymentId: { type: String, required: true },
  amount: { type: Number, required: true },
  planId: { type: String, required: true },
  status: { type: String, default: 'success' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Transaction', transactionSchema);