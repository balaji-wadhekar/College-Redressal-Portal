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

// Dashboard
router.get('/dashboard', async (req, res) => {
  try {
    let query = {};
    if (req.session && req.session.user) {
        query.studentEmail = req.session.user.email;
    }
    const grievances = await Grievance.find(query);
    res.render('student/dashboard', { grievances });
  } catch (error) {
    res.status(500).send("Error loading dashboard");
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
