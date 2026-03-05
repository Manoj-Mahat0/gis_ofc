const mongoose = require('mongoose');
const Lead = mongoose.models.Lead || require('../models/Lead');
const User = mongoose.models.User || require('../models/User');
const csv = require('csv-parser');
const xlsx = require('xlsx');
const fs = require('fs');

// @desc    Get all leads
// @route   GET /api/leads
// @access  Private
exports.getLeads = async (req, res) => {
  try {
    let query = {};

    // If staff, only show assigned leads
    if (req.user.role === 'staff') {
      query.assignedTo = req.user.id;
    }

    // Filter by status
    if (req.query.status) {
      query.status = req.query.status;
    }

    // Filter by priority
    if (req.query.priority) {
      query.priority = req.query.priority;
    }

    // Search by name, email, or phone
    if (req.query.search) {
      query.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
        { phone: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const leads = await Lead.find(query)
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: leads.length,
      data: leads
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single lead
// @route   GET /api/leads/:id
// @access  Private
exports.getLead = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id)
      .populate('assignedTo', 'name email phone');

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    // Check if staff can access this lead
    if (req.user.role === 'staff' && lead.assignedTo.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this lead'
      });
    }

    res.json({
      success: true,
      data: lead
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create new lead
// @route   POST /api/leads
// @access  Private/Admin/Manager
exports.createLead = async (req, res) => {
  try {
    const lead = await Lead.create(req.body);

    res.status(201).json({
      success: true,
      data: lead
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update lead
// @route   PUT /api/leads/:id
// @access  Private
exports.updateLead = async (req, res) => {
  try {
    let lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    // Check if staff can update this lead
    if (req.user.role === 'staff' && lead.assignedTo.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this lead'
      });
    }

    lead = await Lead.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.json({
      success: true,
      data: lead
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete lead
// @route   DELETE /api/leads/:id
// @access  Private/Admin/Manager
exports.deleteLead = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    await lead.deleteOne();

    res.json({
      success: true,
      message: 'Lead deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Assign lead to staff
// @route   PUT /api/leads/:id/assign
// @access  Private/Admin/Manager
exports.assignLead = async (req, res) => {
  try {
    const { staffId } = req.body;

    const lead = await Lead.findByIdAndUpdate(
      req.params.id,
      { assignedTo: staffId },
      { new: true, runValidators: true }
    ).populate('assignedTo', 'name email');

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    res.json({
      success: true,
      data: lead
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const { Readable } = require('stream');

// @desc    Import leads from CSV/Excel
// @route   POST /api/leads/import
// @access  Private/Admin/Manager
exports.importLeads = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a file'
      });
    }

    const fileName = req.file.originalname;
    let leads = [];

    if (fileName.endsWith('.csv')) {
      // Parse CSV from buffer
      const results = [];
      await new Promise((resolve, reject) => {
        const readable = new Readable();
        readable._read = () => { };
        readable.push(req.file.buffer);
        readable.push(null);

        readable.pipe(csv())
          .on('data', (data) => results.push(data))
          .on('end', () => resolve())
          .on('error', (err) => reject(err));
      });
      leads = results;
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      // Parse Excel from buffer
      const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      leads = xlsx.utils.sheet_to_json(sheet);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Unsupported file format. Please upload CSV or Excel file.'
      });
    }

    // Map and save leads
    const leadData = leads.map(l => ({
      name: l.Name || l.name || '',
      email: l.Email || l.email || '',
      phone: l.Phone || l.phone || l.PhoneNumber || l.mobile || '',
      organization: l.Organization || l.organization || l.Company || '',
      address: l.Address || l.address || '',
      pancard: l.Pancard || l.pancard || '',
      createdBy: req.user.id,
      status: 'new'
    })).filter(l => l.name && l.phone); // Basic validation

    if (leadData.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid leads found in the file'
      });
    }

    await Lead.insertMany(leadData);

    res.json({
      success: true,
      count: leadData.length,
      message: `${leadData.length} leads imported successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Export leads to CSV/Excel
// @route   GET /api/leads/export
// @access  Private/Admin/Manager
exports.exportLeads = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'staff') {
      query.assignedTo = req.user.id;
    }

    const leads = await Lead.find(query).lean();

    if (leads.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No leads found to export'
      });
    }

    // Convert to CSV
    const header = ['Name', 'Email', 'Phone', 'Organization', 'Address', 'Pancard', 'Status', 'Staff Remarks'];
    const rows = leads.map(l => [
      l.name,
      l.email || '',
      l.phone,
      l.organization || '',
      l.address || '',
      l.pancard || '',
      l.status,
      l.staffRemarks || ''
    ]);

    let csvContent = header.join(',') + '\n';
    rows.forEach(row => {
      csvContent += row.map(cell => `"${cell.toString().replace(/"/g, '""')}"`).join(',') + '\n';
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=leads_export.csv');
    res.status(200).send(csvContent);

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
