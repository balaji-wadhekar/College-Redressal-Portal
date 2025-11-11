const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Login (accepts email or enrollment number as username)
router.post('/login', async (req, res) => {
  try {
    const { email, password, enrollment } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Username/Enrollment and password are required' });
    }

    // Find user by email (which is enrollment number for students)
    let user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    req.session.user = {
      id: user._id,
      email: user.email,
      role: user.role,
      enrollment: user.enrollment,
      name: user.name
    };

    res.json({
      success: true,
      user: {
        email: user.email,
        role: user.role,
        enrollment: user.enrollment,
        name: user.name
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
router.get('/check', (req, res) => {
  if (req.session.user) {
    res.json({ authenticated: true, user: req.session.user });
  } else {
    res.json({ authenticated: false });
  }
});

// Register (admin only - use /api/users/add instead)
router.post('/register', async (req, res) => {
  // Disabled for security - admin should use /api/users/add
  return res.status(403).json({ error: 'Registration disabled. Contact admin for account creation.' });
  
  /*
  try {
    const { email, password, role, enrollment } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ error: 'Email, password, and role are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const user = new User({
      email,
      password,
      role,
      enrollment: enrollment || 'N/A'
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: {
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
  */
});

module.exports = router;
