const mongoose = require('mongoose');

const portalDocumentSchema = new mongoose.Schema({
  docId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  caseId: {
    type: String,
    default: '',
    index: true
  },
  clientId: {
    type: String,
    required: true,
    index: true
  },
  companyName: {
    type: String,
    default: '',
    trim: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  fileName: {
    type: String,
    required: true,
    trim: true
  },
  fileUrl: {
    type: String,
    required: true,
    trim: true
  },
  fileSize: {
    type: String,
    default: '0 KB'
  },
  fileType: {
    type: String,
    default: 'application/pdf'
  },
  category: {
    type: String,
    enum: ['certificate', 'filing', 'government_letter', 'client_kyc', 'company_document', 'presentation', 'report', 'other'],
    default: 'certificate'
  },
  docType: {
    type: String,
    enum: ['company', 'issued'],
    default: 'issued',
    index: true
  },
  uploadedBy: {
    type: String,
    enum: ['operations', 'client'],
    default: 'operations'
  },
  status: {
    type: String,
    enum: ['approved', 'pending_verification', 'rejected', 'revoked'],
    default: 'approved'
  },
  gridFsFileId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

portalDocumentSchema.virtual('id').get(function () {
  return this._id ? this._id.toHexString() : this.docId;
});

portalDocumentSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id ? ret._id.toString() : ret.id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.models.PortalDocument || mongoose.model('PortalDocument', portalDocumentSchema);
