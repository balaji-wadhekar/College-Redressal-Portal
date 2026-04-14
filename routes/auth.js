const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Login
router.post('/login', async (req, res) => {
  try {
    const { loginType, email, password, name, enrollmentNumber, enrollment } = req.body;
    let user;

    if (loginType === 'admin') {
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required for admin login' });
      }
      user = await User.findOne({ email: email.toLowerCase().trim(), role: 'admin' });
      if (!user) {
        return res.status(401).json({ error: 'Invalid admin credentials' });
      }
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
         return res.status(401).json({ error: 'Invalid admin credentials' });
      }
    } else { // Student
      const reqName = name || '';
      const reqEnrollment = enrollmentNumber || enrollment || '';

      if (!reqName || !reqEnrollment) {
        return res.status(400).json({ error: 'Name and Enrollment Number are required' });
      }

      user = await User.findOne({
        name: reqName.trim(),
        enrollment: reqEnrollment.trim().toUpperCase()
      });

      if (!user) {
        return res.status(401).json({ error: 'Name and Enrollment Number do not match official college records.' });
      }
    }

    req.session.userId = user._id;
    req.session.user = {
      id: user._id,
      email: user.email,
      role: user.role,
      enrollment: user.enrollment,
      name: user.name,
      phone: user.phone
    };

    res.json({
      success: true,
      redirect: '/student/dashboard',
      user: {
        email: user.email,
        role: user.role,
        enrollment: user.enrollment,
        name: user.name,
        phone: user.phone
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to logout' });
    }
    res.json({ success: true, message: 'Logged out successfully' });
  });
});

// Check session
router.get('/check', async (req, res) => {
  if (req.session.user) {
    try {
      // Fetch fresh data from DB to ensure name/details are current
      const user = await User.findById(req.session.user.id);
      if (user) {
        // Update session with fresh data
        req.session.user = {
          id: user._id,
          email: user.email,
          role: user.role,
          enrollment: user.enrollment,
          name: user.name,
          phone: user.phone
        };
        return res.json({ authenticated: true, user: req.session.user });
      }
    } catch (err) {
      console.error('Session check DB error:', err);
    }
    // Fallback to session data if DB fails
    res.json({ authenticated: true, user: req.session.user });
  } else {
    res.json({ authenticated: false });
  }
});

module.exports = router;
