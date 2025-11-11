const express = require('express');
const router = express.Router();
const User = require('../models/User');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

// Configure multer for CSV uploads
const upload = multer({ dest: 'uploads/' });

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Generate random password
function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$';
  let password = '';
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

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

// Get all students with passwords (admin only) - for initial distribution
router.get('/credentials', isAdmin, async (req, res) => {
  try {
    // Note: In production, you should store generated passwords separately
    // This is for initial credential distribution only
    const students = await User.find({ role: 'student' })
      .select('email enrollment createdAt')
      .sort({ createdAt: -1 });

    res.json({ 
      success: true, 
      students,
      note: 'Passwords are hashed and cannot be retrieved. Use reset functionality for password changes.'
    });
  } catch (error) {
    console.error('Get credentials error:', error);
    res.status(500).json({ error: 'Failed to fetch credentials' });
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

    // Generate password
    const password = generatePassword();

    // Create user (email = enrollment for login)
    const user = new User({
      email: enrollment,
      password: password,
      role: 'student',
      enrollment: enrollment,
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
        password: password, // Return password only once for admin to distribute
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

    const results = [];
    const errors = [];
    const addedStudents = [];

    // Read and parse CSV
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (row) => {
        results.push(row);
      })
      .on('end', async () => {
        // Process each row
        for (let i = 0; i < results.length; i++) {
          const row = results[i];
          
          // Expected columns: enrollment, name (or EnrollmentNumber, Name)
          const enrollment = row.enrollment || row.EnrollmentNumber || row.ENROLLMENT;
          const name = row.name || row.Name || row.NAME;

          if (!enrollment || !name) {
            errors.push({
              row: i + 1,
              data: row,
              error: 'Missing enrollment or name'
            });
            continue;
          }

          try {
            // Check if user already exists
            const existingUser = await User.findOne({ 
              $or: [{ email: enrollment }, { enrollment: enrollment }] 
            });

            if (existingUser) {
              errors.push({
                row: i + 1,
                enrollment: enrollment,
                error: 'Student already exists'
              });
              continue;
            }

            // Generate password
            const password = generatePassword();

            // Create user
            const user = new User({
              email: enrollment,
              password: password,
              role: 'student',
              enrollment: enrollment,
              name: name
            });

            await user.save();

            addedStudents.push({
              enrollment: enrollment,
              name: name,
              username: enrollment,
              password: password
            });

          } catch (err) {
            errors.push({
              row: i + 1,
              enrollment: enrollment,
              error: err.message
            });
          }
        }

        // Delete uploaded file
        fs.unlinkSync(req.file.path);

        res.json({
          success: true,
          message: `Successfully added ${addedStudents.length} students`,
          addedStudents: addedStudents,
          errors: errors.length > 0 ? errors : undefined,
          totalProcessed: results.length,
          successCount: addedStudents.length,
          errorCount: errors.length
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

// Reset student password (admin only)
router.post('/:id/reset-password', isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'Student not found' });
    }

    if (user.role !== 'student') {
      return res.status(400).json({ error: 'Cannot reset admin password' });
    }

    // Generate new password
    const newPassword = generatePassword();
    user.password = newPassword;
    await user.save();

    res.json({ 
      success: true, 
      message: 'Password reset successfully',
      student: {
        enrollment: user.enrollment,
        username: user.email,
        password: newPassword
      }
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

module.exports = router;
