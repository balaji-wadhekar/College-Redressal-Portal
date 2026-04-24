const express = require('express');
const router = express.Router();
const Grievance = require('../models/Complaint'); // Using Complaint model but named Grievance
const multer = require('multer');
const path = require('path');
const { uploadToCloudinary } = require('../config/cloudinary');

// Use memory storage for Vercel
const upload = multer({ 
  storage: multer.memoryStorage(), 
  limits: { fileSize: 5 * 1024 * 1024 } 
});

// Middleware to check if user is authenticated (Native JWT)
const jwt = require('jsonwebtoken');
const isAuthenticated = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.statusCode = 401;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ success: false, error: 'Not authenticated' }));
  }

  jwt.verify(token, process.env.SESSION_SECRET || 'fallback_secret', (err, decoded) => {
    if (err) {
      res.statusCode = 403;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ success: false, error: 'Forbidden' }));
    }
    req.user = decoded;
    next();
  });
};

// Dashboard
router.get('/dashboard', isAuthenticated, async (req, res) => {
  try {
    let query = {};
    if (req.user) {
        query.studentEmail = req.user.email;
    }
    const grievances = await Grievance.find(query);
    
    // If still using EJS for this old route
    res.render('student/dashboard', { grievances });
  } catch (error) {
    res.statusCode = 500;
    res.end("Error loading dashboard");
  }
});

// View Grievance Details
router.get('/grievance/:id', async (req, res) => {
  const grievance = await Grievance.findById(req.params.id);
  res.render('student/grievance_detail', { grievance });
});

// Render Edit Form
router.get('/grievance/:id/edit', async (req, res) => {
  const grievance = await Grievance.findById(req.params.id);
  // Optional Security: Only allow editing if Pending
  if(grievance.status !== 'Pending') return res.status(403).send("Cannot edit an in-progress grievance.");
  res.render('student/edit_grievance', { grievance });
});

// Process the Edit Update
router.post('/grievance/:id/edit', upload.single('document'), async (req, res) => {
  const { title, category, description } = req.body;
  const updateData = { title, category, description };

  if (req.file) {
      try {
        const result = await uploadToCloudinary(req.file.buffer, 'grievance-portal/docs', req.file.originalname);
        updateData.docPath = result.secure_url;
        updateData.docPublicId = result.public_id;
      } catch (uploadErr) {
        console.error('Cloudinary upload error:', uploadErr);
      }
  }
  await Grievance.findByIdAndUpdate(req.params.id, updateData);
  res.redirect('/student/grievance/' + req.params.id);
});

// Process Delete
router.post('/grievance/:id/delete', async (req, res) => {
  await Grievance.findByIdAndDelete(req.params.id);
  res.redirect('/student/dashboard');
});

module.exports = router;
