const mongoose = require('mongoose');

const visitorRecordSchema = new mongoose.Schema({
  visitorKey: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  ipHash: {
    type: String,
    default: ''
  },
  userAgent: {
    type: String,
    default: ''
  },
  firstSeen: {
    type: Date,
    default: Date.now
  },
  lastSeen: {
    type: Date,
    default: Date.now
  }
});

const visitorStatsSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    default: 'global_visitor_stats'
  },
  uniqueCount: {
    type: Number,
    default: 29
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

const VisitorRecord = mongoose.models.VisitorRecord || mongoose.model('VisitorRecord', visitorRecordSchema);
const VisitorStats = mongoose.models.VisitorStats || mongoose.model('VisitorStats', visitorStatsSchema);

module.exports = {
  VisitorRecord,
  VisitorStats
};
