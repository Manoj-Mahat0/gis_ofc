const mongoose = require('mongoose');

const locationLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  latitude: {
    type: Number,
    required: true
  },
  longitude: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['check_in', 'check_out', 'periodic', 'call', 'other'],
    default: 'periodic'
  },
  accuracy: {
    type: Number,
    default: 0
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  address: {
    type: String,
    trim: true
  }
});

// Index for efficient queries
locationLogSchema.index({ userId: 1, timestamp: -1 });

module.exports = mongoose.model('LocationLog', locationLogSchema);
