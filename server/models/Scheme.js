const mongoose = require('mongoose');

const schemeSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  stage: {
    type: String,
    default: 'Idea',
    trim: true
  },
  fundingType: {
    type: String,
    default: 'Grant',
    trim: true
  },
  amount: {
    type: String,
    default: 'Custom Grant Support',
    trim: true
  },
  amountValue: {
    type: Number,
    default: 0
  },
  deadline: {
    type: String,
    default: 'Rolling / Ongoing',
    trim: true
  },
  industry: {
    type: String,
    default: 'All sectors',
    trim: true
  },
  state: {
    type: String,
    default: 'All India',
    trim: true
  },
  founderType: {
    type: String,
    default: 'All Founder Eligible',
    trim: true
  },
  entityType: {
    type: String,
    default: 'Pvt Ltd , LLP , Proprietor',
    trim: true
  },
  programType: {
    type: String,
    default: '',
    trim: true
  },
  registrations: {
    type: String,
    default: 'No Mandatory Registration',
    trim: true
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  tier: {
    type: String,
    default: 'pro',
    enum: ['free', 'pro']
  }
}, {
  timestamps: true
});

const Scheme = mongoose.models.Scheme || mongoose.model('Scheme', schemeSchema);
module.exports = Scheme;
