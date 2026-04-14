const express = require('express');
const router = express.Router();
const Complaint = require('../models/Complaint');
const mult = require('multer');
const path = require('path');
const { sendStatusUpdateEmail } = require('../utils/emailService');

// Configure Multer for file uploads
const storage = mult.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    // Generate unique filename: id-timestamp.ext
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = mult({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
};

// Get all complaints (filtered by role)
router.get('/', isAuthenticated, async (req, res) => {
  try {
    let query = {};
    if (req.session.user.role === 'student') {
      // Filter strictly for the logged-in student
      query.studentId = req.session.user.id;
    }
    
    const complaints = await Complaint.find(query).sort({ createdAt: -1 });

    res.json({
      success: true,
      complaints
    });
  } catch (error) {
    console.error('Get complaints error:', error);
    res.status(500).json({ error: 'Failed to fetch complaints' });
  }
});

// Get specific complaint
router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    if (req.session.user.role !== 'admin' && complaint.studentId.toString() !== req.session.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ success: true, complaint });
  } catch (error) {
    console.error('Get complaint error:', error);
    res.status(500).json({ error: 'Failed to fetch complaint' });
  }
});

// Create new complaint (student only)
// Note: 'docFile' matches the form field name
router.post('/', isAuthenticated, upload.single('docFile'), async (req, res) => {
  try {
    if (req.session.user.role !== 'student') {
      return res.status(403).json({ error: 'Only students can file complaints' });
    }

    const {
      title, category, description, incidentDate,
      studentName, studentPhone, studentEnrollment, studentDept, studentEmail,
      docTitle
    } = req.body;

    // Only check the essential grievance fields
    if (!title || !category || !description) {
      return res.status(400).json({ error: "Title, Category, and Description are required to submit a grievance." });
    }

    // Generate a unique trackingID (e.g., GRV-A1B2C3)
    const randomString = require('crypto').randomBytes(3).toString('hex').toUpperCase();
    const trackingID = `GRV-${randomString}`;

    const complaint = new Complaint({
      trackingID,
      title,
      category,
      description,
      incidentDate,
      studentEmail: studentEmail || req.session.user.email,
      studentId: req.session.user.id,
      // Personal Info
      studentName,
      studentPhone,
      studentEnrollment,
      studentDept,
      // Document Details
      docTitle: docTitle || '',
      docPath: req.file ? req.file.filename : null // Save file path if file exists
    });

    await complaint.save();

    res.status(201).json({
      success: true,
      message: 'Complaint submitted successfully',
      complaint
    });

  } catch (error) {
    console.error('Create complaint error:', error);
    res.status(500).json({ error: 'Failed to create complaint' });
  }
});

// Update complaint status (admin only)
router.patch('/:id/status', isAuthenticated, async (req, res) => {
  try {
    if (req.session.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can update status' });
    }

    const { status } = req.body;

    if (!status || !['Pending', 'In Progress', 'Resolved'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: Date.now() },
      { new: true }
    );

    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    // === AGGRESSIVE LOGGING INJECTED HERE ===
    console.log('--- DEBUG EMAIL TRIGGER ---');
    console.log('Found Grievance:', complaint.trackingID || ('#' + complaint._id.toString().substring(18)));
    console.log('Student Email:', complaint.studentEmail || 'N/A');
    console.log('Student Name:', complaint.studentName || 'N/A');
    // ========================================

    // Attempt to send the automated email notification
    if (status === 'In Progress' || status === 'Resolved') {
      try {
        await sendStatusUpdateEmail(
          complaint.studentEmail, 
          complaint.studentName, 
          complaint.trackingID || ('#' + complaint._id.toString().substring(18)), 
          status
        );
      } catch (emailError) {
        // Output specific Nodemailer failure reason
        console.error('NODEMAILER ERROR:', emailError);
      }
    }

    res.json({
      success: true,
      message: `Complaint marked as ${status}`,
      complaint
    });

  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// Delete complaint (student only, and only if pending)
router.delete('/:id', isAuthenticated, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    if (req.session.user.role !== 'admin' &&
      complaint.studentEmail !== req.session.user.email) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (complaint.status !== 'Pending') {
      return res.status(400).json({
        error: 'Only pending complaints can be deleted'
      });
    }

    await Complaint.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Complaint deleted successfully'
    });

  } catch (error) {
    console.error('Delete complaint error:', error);
    res.status(500).json({ error: 'Failed to delete complaint' });
  }
});

// Get statistics
router.get('/stats/summary', isAuthenticated, async (req, res) => {
  try {
    let query = {};

    if (req.session.user.role === 'student') {
      query.studentEmail = req.session.user.email;
    }

    const complaints = await Complaint.find(query);

    const stats = {
      total: complaints.length,
      pending: complaints.filter(c => c.status === 'Pending').length,
      inProgress: complaints.filter(c => c.status === 'In Progress').length,
      resolved: complaints.filter(c => c.status === 'Resolved').length
    };

    const categoryBreakdown = {};
    complaints.forEach(c => {
      categoryBreakdown[c.category] = (categoryBreakdown[c.category] || 0) + 1;
    });

    res.json({
      success: true,
      stats,
      categoryBreakdown
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

module.exports = router;
