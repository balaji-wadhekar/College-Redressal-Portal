const express = require('express');
const router = express.Router();
const User = require('../models/User');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'collegeportal.demo@gmail.com',
    pass: process.env.EMAIL_PASS || 'password'
  }
});

// POST Admin Login
router.post('/admin-login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.render('auth/login', { error: 'Email and password are required.', activeTab: 'admin' });
    }
    const user = await User.findOne({ email: email.toLowerCase().trim(), role: 'admin' });
    if (!user) {
      return res.render('auth/login', { error: 'Invalid admin credentials.', activeTab: 'admin' });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.render('auth/login', { error: 'Invalid admin credentials.', activeTab: 'admin' });
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

    // Explicitly save session before redirecting (critical for serverless)
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.render('auth/login', { error: 'Login failed. Please try again.', activeTab: 'admin' });
      }
      res.redirect('/admin.html');
    });
  } catch (error) {
    console.error('Admin login error:', error.message, error.stack);
    res.render('auth/login', { error: 'Server error during login. Please try again.', activeTab: 'admin' });
  }
});

// STEP 1: Request OTP
router.post('/login', async (req, res) => {
try {
const { enrollmentNumber, email } = req.body;
const safeEnrollment = Array.isArray(enrollmentNumber) ? enrollmentNumber[0] : enrollmentNumber;
const safeEmail = Array.isArray(email) ? email[0] : email;

const cleanEnrollment = safeEnrollment ? String(safeEnrollment).toUpperCase().trim() : '';
const cleanEmail = safeEmail ? String(safeEmail).toLowerCase().trim() : '';

    if (!cleanEnrollment.startsWith('ADT')) {
        return res.status(400).render('auth/login', {
            error: "Enrollment Number must start with 'ADT'.",
            activeTab: 'student'
        });
    }
// Generate 4-digit code
const otp = Math.floor(1000 + Math.random() * 9000).toString();
// Demo Magic Upsert
let user;
try {
    user = await User.findOneAndUpdate(
    { enrollment: cleanEnrollment },
    { role: 'student', email: cleanEmail, otp: otp, otpExpires: Date.now() + 5 * 60 * 1000 },
    { upsert: true, new: true }
    );
} catch (error) {
    if (error.code === 11000) {
        return res.status(400).render('auth/login', {
            error: "This email is already registered to a different Enrollment Number. Please use your correct enrollment number or email.",
            activeTab: 'student'
        });
    }
    throw error;
}

// Send Email
await transporter.sendMail({
    from: '"College Portal" <your-email@gmail.com>',
    to: user.email,
    subject: "Your Portal Login Code",
    html: `<div style="text-align: center; padding: 20px; font-family: Arial;"><h2>Student Login</h2><p>Your 4-Digit Code is:</p><h1 style="color: #003366; letter-spacing: 5px;">${otp}</h1></div>`
});
// Render OTP field
res.render('auth/login', {
  success: `Code sent to ${user.email}`,
    showOtpField: true,
    enrollmentNumber: cleanEnrollment,
    email: cleanEmail,
    activeTab: 'student'
});
} catch (err) {
console.error(err);
res.status(500).render('auth/login', { error: "Server error sending code.", activeTab: 'student' });
}

});

// STEP 2: Verify OTP
router.post('/verify-otp', async (req, res) => {
try {
const { enrollmentNumber, email, otp } = req.body;

const safeEnrollment = Array.isArray(enrollmentNumber) ? enrollmentNumber[0] : enrollmentNumber;
const safeEmail = Array.isArray(email) ? email[0] : email;
const safeOtp = Array.isArray(otp) ? otp[0] : otp;

const cleanEnrollment = safeEnrollment ? String(safeEnrollment).toUpperCase().trim() : '';
const cleanEmail = safeEmail ? String(safeEmail).toLowerCase().trim() : '';
const cleanOtp = safeOtp ? String(safeOtp).trim() : '';

const user = await User.findOne({
enrollment: cleanEnrollment, email: cleanEmail, role: 'student', otp: cleanOtp, otpExpires: { $gt: Date.now() }
});

if (!user) {
    return res.status(400).render('auth/login', {
        error: "Invalid or expired code. Please try again.",
        showOtpField: true, enrollmentNumber, email, activeTab: 'student'
    });
}
// Success - Log in
user.otp = null; user.otpExpires = null; await user.save();
req.session.userId = user._id;
req.session.role = 'student';
req.session.user = {
  id: user._id,
  email: user.email,
  role: user.role,
  enrollment: user.enrollment,
  name: user.name,
  phone: user.phone
};
req.session.save(() => { res.redirect('/student.html'); });
} catch (err) {
console.error(err);
res.status(500).render('auth/login', { error: "Server error verifying code.", activeTab: 'student' });
}

});

// Render Initial Login Page
router.get('/login', (req, res) => {
  res.render('auth/login', { error: null });
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
      const user = await User.findById(req.session.user.id);
      if (user) {
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
    res.json({ authenticated: true, user: req.session.user });
  } else {
    res.json({ authenticated: false });
  }
});

module.exports = router;
