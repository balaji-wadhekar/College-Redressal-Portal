const express = require('express');
const router = express.Router();
const Complaint = require('../models/Complaint');

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
};

// Get all complaints (admin) or user's complaints (student)
router.get('/', isAuthenticated, async (req, res) => {
  try {
    let complaints;
    
    if (req.session.user.role === 'admin') {
      complaints = await Complaint.find().sort({ createdAt: -1 });
    } else {
      complaints = await Complaint.find({ 
        studentEmail: req.session.user.email 
      }).sort({ createdAt: -1 });
    }

    res.json({ success: true, complaints });

  } catch (error) {
    console.error('Get complaints error:', error);
    res.status(500).json({ error: 'Failed to fetch complaints' });
  }
});

// Get single complaint by ID
router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    if (req.session.user.role !== 'admin' && 
        complaint.studentEmail !== req.session.user.email) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ success: true, complaint });

  } catch (error) {
    console.error('Get complaint error:', error);
    res.status(500).json({ error: 'Failed to fetch complaint' });
  }
});

// Create new complaint (student only)
router.post('/', isAuthenticated, async (req, res) => {
  try {
    if (req.session.user.role !== 'student') {
      return res.status(403).json({ error: 'Only students can file complaints' });
    }

    const { title, category, description } = req.body;

    if (!title || !category || !description) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const complaint = new Complaint({
      title,
      category,
      description,
      studentEmail: req.session.user.email,
      studentId: req.session.user.id
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
