const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  orderId: {
    type: String,
    required: true,
    index: true
  },
  paymentId: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  planId: {
    type: String,
    required: true
  },
  status: {
    type: String,
    default: 'success'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

transactionSchema.virtual('id').get(function() {
  return this._id ? this._id.toHexString() : '';
});

transactionSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id ? ret._id.toString() : ret.id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

transactionSchema.set('toObject', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id ? ret._id.toString() : ret.id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema);
