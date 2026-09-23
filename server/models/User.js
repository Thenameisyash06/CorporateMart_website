const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  phone: {
    type: String,
    default: '',
    trim: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  salt: {
    type: String,
    required: true
  },
  companyName: {
    type: String,
    default: '',
    trim: true
  },
  plan: {
    type: String,
    enum: ['free', 'pro'],
    default: 'free'
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'client', 'operations'],
    default: 'user'
  },
  status: {
    type: String,
    enum: ['active', 'pending', 'suspended', 'inactive'],
    default: 'active'
  },
  isSubscribed: {
    type: Boolean,
    default: false
  },
  subscriptionExpiresAt: {
    type: Date,
    default: null
  },
  pushSubscriptions: {
    type: [Object],
    default: []
  },
  resetOtp: {
    type: String,
    default: null
  },
  resetOtpExpires: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Helper virtual to format id string consistently
userSchema.virtual('id').get(function() {
  return this._id ? this._id.toHexString() : '';
});

userSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id ? ret._id.toString() : ret.id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

userSchema.set('toObject', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id ? ret._id.toString() : ret.id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
