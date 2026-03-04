const CallLog = require('../models/CallLog');
const Lead = require('../models/Lead');

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
