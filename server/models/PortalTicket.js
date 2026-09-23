const mongoose = require('mongoose');

const portalTicketSchema = new mongoose.Schema({
  ticketId: {
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
    default: '',
    trim: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['dsc', 'certificate', 'status_inquiry', 'billing', 'general'],
    default: 'general'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved'],
    default: 'open'
  },
  messages: [
    {
      sender: {
        type: String,
        enum: ['client', 'operations', 'system'],
        default: 'client'
      },
      senderName: {
        type: String,
        default: 'Operations Staff'
      },
      text: {
        type: String,
        required: true
      },
      date: {
        type: Date,
        default: Date.now
      }
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

portalTicketSchema.virtual('id').get(function () {
  return this._id ? this._id.toHexString() : this.ticketId;
});

portalTicketSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id ? ret._id.toString() : ret.id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.models.PortalTicket || mongoose.model('PortalTicket', portalTicketSchema);
