const mongoose = require('mongoose');

const portalCaseSchema = new mongoose.Schema({
  caseId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  clientId: {
    type: String,
    required: true,
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
    trim: true,
    index: true
  },
  serviceName: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['in_review', 'approved', 'rejected', 'pending_documents'],
    default: 'in_review'
  },
  statusNote: {
    type: String,
    default: 'Case opened and assigned for verification.'
  },
  documentsCount: {
    type: Number,
    default: 0
  },
  timeline: [
    {
      stage: { type: String, required: true },
      status: { type: String, required: true },
      note: { type: String, default: '' },
      date: { type: Date, default: Date.now }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

portalCaseSchema.virtual('id').get(function () {
  return this._id ? this._id.toHexString() : this.caseId;
});

portalCaseSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id ? ret._id.toString() : ret.id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.models.PortalCase || mongoose.model('PortalCase', portalCaseSchema);
