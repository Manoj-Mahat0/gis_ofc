const mongoose = require('mongoose');
const CallLog = mongoose.models.CallLog || require('../models/CallLog');
const Lead = mongoose.models.Lead || require('../models/Lead');

// @desc    Get all call logs for staff
// @route   GET /api/calls
// @access  Private
exports.getCallLogs = async (req, res) => {
  try {
    const query = req.user.role === 'admin'
      ? {}
      : { staffId: req.user.id };

    const callLogs = await CallLog.find(query)
      .populate('leadId', 'name phone email organization')
      .populate('staffId', 'name email')
      .sort({ startTime: -1 })
      .limit(100);

    res.json({
      success: true,
      count: callLogs.length,
      data: callLogs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Log a new call
// @route   POST /api/calls
// @access  Private
exports.logCall = async (req, res) => {
  try {
    const { leadId, startTime, endTime, remarks } = req.body;

    // Verify lead exists
    const lead = await Lead.findById(leadId);
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    const callLog = await CallLog.create({
      leadId,
      staffId: req.user.id,
      startTime: startTime || new Date(),
      endTime,
      remarks,
      status: endTime ? 'completed' : 'ongoing'
    });

    const populatedCallLog = await CallLog.findById(callLog._id)
      .populate('leadId', 'name phone email organization')
      .populate('staffId', 'name email');

    res.status(201).json({
      success: true,
      data: populatedCallLog
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update call log
// @route   PUT /api/calls/:id
// @access  Private
exports.updateCallLog = async (req, res) => {
  try {
    let callLog = await CallLog.findById(req.params.id);

    if (!callLog) {
      return res.status(404).json({
        success: false,
        message: 'Call log not found'
      });
    }

    // Check ownership
    if (callLog.staffId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this call log'
      });
    }

    callLog = await CallLog.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('leadId', 'name phone email organization')
      .populate('staffId', 'name email');

    res.json({
      success: true,
      data: callLog
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete call log
// @route   DELETE /api/calls/:id
// @access  Private/Admin
exports.deleteCallLog = async (req, res) => {
  try {
    const callLog = await CallLog.findById(req.params.id);

    if (!callLog) {
      return res.status(404).json({
        success: false,
        message: 'Call log not found'
      });
    }

    await callLog.deleteOne();

    res.json({
      success: true,
      message: 'Call log deleted'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Sync multiple call logs from mobile device
// @route   POST /api/calls/sync
// @access  Private
exports.syncCallLogs = async (req, res) => {
  try {
    const { logs } = req.body; // Array of { phone, startTime, duration, type }

    if (!logs || !Array.isArray(logs)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of call logs'
      });
    }

    let syncedCount = 0;
    const errors = [];

    for (const log of logs) {
      try {
        // Normalize phone number for matching (remove spaces, dashes, +91)
        const normalizedPhone = log.phone.replace(/[\s\-\+\(\)]/g, '').slice(-10);

        // Find lead matching the last 10 digits
        const lead = await Lead.findOne({
          phone: { $regex: normalizedPhone + '$' }
        });

        if (lead) {
          // Check if this specific call (same lead, same start time) already exists
          const existingLog = await CallLog.findOne({
            leadId: lead._id,
            startTime: new Date(log.startTime)
          });

          if (!existingLog) {
            await CallLog.create({
              leadId: lead._id,
              staffId: req.user.id,
              startTime: new Date(log.startTime),
              endTime: new Date(new Date(log.startTime).getTime() + (log.duration * 1000)),
              duration: log.duration,
              remarks: `Auto-synced from phone (${log.type})`,
              status: 'completed'
            });
            syncedCount++;
          }
        }
      } catch (err) {
        errors.push({ phone: log.phone, error: err.message });
      }
    }

    res.json({
      success: true,
      message: `Successfully synced ${syncedCount} call logs`,
      syncedCount,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
