const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const pdfLib = require('pdf-parse');
const mammoth = require('mammoth');

// Configure multer for CSV uploads
const upload = multer({ dest: 'uploads/' });

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};



// Get all students (admin only)
router.get('/', isAdmin, async (req, res) => {
  try {
    const students = await User.find({ role: 'student' })
      .select('email enrollment createdAt')
      .sort({ createdAt: -1 });

    res.json({ success: true, students });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});



// Add single student (admin only)
router.post('/add', isAdmin, async (req, res) => {
  try {
    const { enrollment, name } = req.body;

    if (!enrollment || !name) {
      return res.status(400).json({ error: 'Enrollment number and name are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email: enrollment }, { enrollment: enrollment }]
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Student with this enrollment number already exists' });
    }

    const enrollmentUpper = enrollment.toUpperCase();

    // Create user (email = enrollment for login)
    const user = new User({
      email: enrollmentUpper,
      role: 'student',
      enrollment: enrollmentUpper,
      name: name
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: 'Student added successfully',
      student: {
        enrollment: enrollment,
        name: name,
        username: enrollment,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('Add student error:', error);
    res.status(500).json({ error: 'Failed to add student' });
  }
});

// Bulk add students via CSV (admin only)
router.post('/bulk-upload', isAdmin, upload.single('csvFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'CSV file is required' });
    }

    // Read and parse CSV
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', async (row) => {
        try {
          // 1. Normalize headers: lowercase everything and remove spaces/special characters
          const cleanRow = {};
          for (const key in row) {
            const cleanKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
            cleanRow[cleanKey] = row[key];
          }

          // 2. Smart Match: Look for common variations of PRN/Roll No and Name
          const extractedEnrollment = cleanRow['prn'] || cleanRow['rollno'] || cleanRow['enrollmentno'] || cleanRow['seatno'] || cleanRow['id'] || cleanRow['enrollment'];
          const extractedName = cleanRow['name'] || cleanRow['studentname'] || cleanRow['candidatename'] || cleanRow['fullname'];

          // 3. Safety Check: If it's a blank row or missing critical data, skip it smoothly
          if (!extractedEnrollment || !extractedName) {
              return;
          }

          // 4. Save to Database
          // Used 'enrollment' field since that's the real DB schema column and preserved email/password initialization
          let enrollment = String(extractedEnrollment).trim().toUpperCase();
          const hashedPassword = await bcrypt.hash(enrollment, 10);

          await User.findOneAndUpdate(
              { enrollment: enrollment },
              { name: String(extractedName).trim(), email: enrollment.toLowerCase(), role: 'student', password: hashedPassword },
              { upsert: true, new: true }
          );
        } catch (err) {
          console.error("Error processing CSV row:", err);
        }
      })
      .on('end', () => {
        // Delete uploaded file
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

        res.json({
          success: true,
          message: `CSV processing started. Uniquely filtered and mapped records are syncing to the database.`
        });
      })
      .on('error', (error) => {
        // Delete uploaded file
        if (req.file && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ error: 'Failed to parse CSV file: ' + error.message });
      });

  } catch (error) {
    console.error('Bulk upload error:', error);
    // Delete uploaded file
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'Failed to upload students' });
  }
});

// Document upload for PDF/DOCX (admin only)
router.post('/upload-document', upload.single('document'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No file uploaded" });

        let documentText = "";

        if (req.file.mimetype === 'application/pdf') {
            const fileSystem = require('fs');
            const dataBuffer = fileSystem.readFileSync(req.file.path);
            const pdfPkg = require('pdf-parse');

            if (pdfPkg.PDFParse) {
                // Handle breaking changes in pdf-parse v2+
                const parser = new pdfPkg.PDFParse({ data: dataBuffer });
                const result = await parser.getText();
                documentText = result.text;
            } else {
                // Fallback for pdf-parse v1.x
                const parseDocument = typeof pdfPkg === 'function' ? pdfPkg : pdfPkg.default;
                if (typeof parseDocument !== 'function') throw new Error("pdf-parse initialization failed.");

                const result = await parseDocument(dataBuffer);
                documentText = result.text;
            }
        }

        // Flexible Line-by-Line Scanner
        const lines = documentText.split('\n');
        let addedCount = 0;

        for (let line of lines) {
            line = line.trim();
            if (!line) continue;

            const enrollmentMatch = line.match(/\b([A-Z0-9-]{5,15})\b/i);
            if (enrollmentMatch) {
                const extractedEnrollment = enrollmentMatch[1].toUpperCase();
                let potentialName = line.replace(enrollmentMatch[0], '').trim();
                potentialName = potentialName.replace(/[^a-zA-Z\s]/g, '').trim();

                if (potentialName.length > 2) {
                    // Mapped enrollmentNumber to enrollment and added required email/password to prevent DB crash
                    const hashedPassword = await bcrypt.hash(extractedEnrollment, 10);
                    await User.findOneAndUpdate(
                        { enrollment: extractedEnrollment },
                        { name: potentialName, email: extractedEnrollment, password: hashedPassword, role: 'student' },
                        { upsert: true }
                    );
                    addedCount++;
                }
            }
        }

        // Clean up temp file
        fs.unlinkSync(req.file.path);
        res.redirect('/admin/manage-users?success=true&count=' + addedCount);

    } catch (err) {
        console.error("CRITICAL PARSE ERROR:", err);
        res.status(500).json({ error: "Failed to read file. Check console." });
    }
});

// Delete student (admin only)
router.delete('/:id', isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'Student not found' });
    }

    if (user.role !== 'student') {
      return res.status(400).json({ error: 'Cannot delete admin users' });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Student deleted successfully'
    });

  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({ error: 'Failed to delete student' });
  }
});

// Student profile update
router.post('/profile/update', async (req, res) => {
  try {
    if (!req.session.user || req.session.user.role !== 'student') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const user = await User.findById(req.session.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Extract and update the department field as requested
    user.department = req.body.department;
    await user.save();

    res.json({ success: true, message: 'Profile updated successfully', user });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

module.exports = router;
