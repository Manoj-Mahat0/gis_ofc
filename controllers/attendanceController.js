const Attendance = require('../models/Attendance');
const LocationLog = require('../models/LocationLog');

// @desc    Check in
// @route   POST /api/attendance/checkin
// @access  Private
exports.checkIn = async (req, res) => {
  try {
    const { latitude, longitude, address } = req.body;

    // Check if already checked in today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const existingAttendance = await Attendance.findOne({
      userId: req.user.id,
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    if (existingAttendance) {
      return res.status(400).json({
        success: false,
        message: 'Already checked in for today'
      });
    }

    const attendance = await Attendance.create({
      userId: req.user.id,
      date: new Date(),
      checkIn: new Date(),
      status: 'ongoing'
    });

    // Log location if provided
    if (latitude && longitude) {
      await LocationLog.create({
        userId: req.user.id,
        latitude,
        longitude,
        address,
        type: 'check_in'
      });
    }

    res.status(201).json({
      success: true,
      data: attendance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Check out
// @route   POST /api/attendance/checkout
// @access  Private
exports.checkOut = async (req, res) => {
  try {
    const { latitude, longitude, address } = req.body;

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    let attendance = await Attendance.findOne({
      userId: req.user.id,
      date: { $gte: startOfDay, $lte: endOfDay },
      checkOut: { $exists: false }
    });

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'No active check-in found for today'
      });
    }

    attendance.checkOut = new Date();
    attendance.calculateHours();
    await attendance.save();

    // Log location if provided
    if (latitude && longitude) {
      await LocationLog.create({
        userId: req.user.id,
        latitude,
        longitude,
        address,
        type: 'check_out'
      });
    }

    res.json({
      success: true,
      data: attendance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get my attendance
// @route   GET /api/attendance
// @access  Private
exports.getMyAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.find({ userId: req.user.id })
      .sort({ date: -1 });

    res.json({
      success: true,
      count: attendance.length,
      data: attendance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all attendance (Admin/Manager)
// @route   GET /api/attendance/all
// @access  Private/Admin/Manager
exports.getAllAttendance = async (req, res) => {
  try {
    let query = {};

    if (req.query.userId) {
      query.userId = req.query.userId;
    }

    if (req.query.date) {
      const start = new Date(req.query.date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(req.query.date);
      end.setHours(23, 59, 59, 999);
      query.date = { $gte: start, $lte: end };
    }

    const attendance = await Attendance.find(query)
      .populate('userId', 'name email role')
      .sort({ date: -1 });

    res.json({
      success: true,
      count: attendance.length,
      data: attendance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
