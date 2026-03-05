const User = require('../models/User');
const LocationLog = require('../models/LocationLog');

// @desc    Update user location
// @route   POST /api/location
// @access  Private
exports.updateLocation = async (req, res) => {
    try {
        const { latitude, longitude } = req.body;

        if (!latitude || !longitude) {
            return res.status(400).json({
                success: false,
                message: 'Please provide latitude and longitude'
            });
        }

        // Update user's last known location
        await User.findByIdAndUpdate(req.user.id, {
            lastLocation: { latitude, longitude },
            lastLocationAt: Date.now()
        });

        // Also log to LocationLog for history (optional, but good for tracking)
        await LocationLog.create({
            userId: req.user.id,
            latitude,
            longitude,
            type: 'periodic'
        });

        // Emit socket event for real-time admin tracking
        const io = req.app.get('io');
        if (io) {
            io.to('admin-room').emit('staff-location-update', {
                userId: req.user.id,
                name: req.user.name,
                latitude,
                longitude,
                timestamp: new Date()
            });
        }

        res.json({
            success: true,
            message: 'Location updated'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get all staff locations
// @route   GET /api/location
// @access  Private/Admin
exports.getAllStaffLocations = async (req, res) => {
    try {
        const staff = await User.find({
            role: 'staff',
            lastLocation: { $exists: true }
        }).select('name email lastLocation lastLocationAt phone');

        res.json({
            success: true,
            count: staff.length,
            data: staff
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
