const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  checkIn: {
    type: Date,
    required: true
  },
  checkOut: {
    type: Date
  },
  totalHours: {
    type: Number, // in hours
    default: 0
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'half_day', 'ongoing'],
    default: 'ongoing'
  },
  remarks: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Calculate total hours and status
attendanceSchema.methods.calculateHours = function() {
  if (this.checkOut && this.checkIn) {
    const hours = (this.checkOut - this.checkIn) / (1000 * 60 * 60);
    this.totalHours = parseFloat(hours.toFixed(2));
    
    if (this.totalHours >= 8) {
      this.status = 'present';
    } else if (this.totalHours >= 4) {
      this.status = 'half_day';
    } else {
      this.status = 'absent';
    }
  }
};

// Unique constraint for user and date
attendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
