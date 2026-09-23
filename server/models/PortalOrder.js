const mongoose = require('mongoose');

const portalOrderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  clientId: {
    type: String,
    default: '',
    index: true
  },
  clientName: {
    type: String,
    default: '',
    trim: true
  },
  companyName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    default: '',
    trim: true
  },
  planName: {
    type: String,
    required: true,
    trim: true
  },
  services: [
    {
      type: String,
      trim: true
    }
  ],
  notes: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending_review', 'contacted', 'activated', 'cancelled'],
    default: 'pending_review'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

portalOrderSchema.virtual('id').get(function () {
  return this._id ? this._id.toHexString() : this.orderId;
});

portalOrderSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id ? ret._id.toString() : ret.id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.models.PortalOrder || mongoose.model('PortalOrder', portalOrderSchema);
