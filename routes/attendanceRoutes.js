const express = require('express');
const router = express.Router();
const {
  checkIn,
  checkOut,
  getMyAttendance,
  getAllAttendance
} = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/', getMyAttendance);
router.post('/checkin', checkIn);
router.post('/checkout', checkOut);

// Admin routes
router.get('/all', authorize('admin', 'manager'), getAllAttendance);

module.exports = router;
