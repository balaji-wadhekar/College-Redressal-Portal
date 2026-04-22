const express = require('express');
const router = express.Router();
const Grievance = require('../models/Complaint'); // Using Complaint model but named Grievance
const mult = require('multer');
const path = require('path');

const storage = mult.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = mult({ storage: storage, limits: { fileSize: 5 * 1024 * 1024 } });

// Dashboard
router.get('/dashboard', async (req, res) => {
  try {
    // Basic mock dashboard if student email isn't in session or similar.
    // Assuming session has user
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
      updateData.docPath = req.file.filename; // Update file if a new one is uploaded
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
