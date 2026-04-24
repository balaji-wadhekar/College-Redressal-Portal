const express = require('express');
const router = express.Router();
const User = require('../models/User');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');

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
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ success: false, error: 'Email and password are required.' }));
    }
    const user = await User.findOne({ email: email.toLowerCase().trim(), role: 'admin' });
    if (!user) {
      res.statusCode = 401;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ success: false, error: 'Invalid admin credentials.' }));
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.statusCode = 401;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ success: false, error: 'Invalid admin credentials.' }));
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role, name: user.name, email: user.email, enrollment: user.enrollment },
      process.env.SESSION_SECRET || 'fallback_secret',
      { expiresIn: '1d' }
    );

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ 
      success: true, 
      message: "Admin logged in successfully", 
      token,
      redirectUrl: '/admin.html',
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        enrollment: user.enrollment,
        name: user.name
      }
    }));
  } catch (error) {
    console.error('Admin login error:', error.message, error.stack);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ success: false, error: 'Server error during login.' }));
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
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({
            success: false,
            error: "Enrollment Number must start with 'ADT'."
        }));
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
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({
            success: false,
            error: "This email is already registered to a different Enrollment Number."
        }));
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
// Return JSON success
res.statusCode = 200;
res.setHeader('Content-Type', 'application/json');
return res.end(JSON.stringify({
  success: true,
  message: `Code sent to ${user.email}`,
  showOtpField: true,
  enrollmentNumber: cleanEnrollment,
  email: cleanEmail
}));
} catch (err) {
console.error(err);
res.statusCode = 500;
res.setHeader('Content-Type', 'application/json');
return res.end(JSON.stringify({ success: false, error: "Server error sending code." }));
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
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({
        success: false,
        error: "Invalid or expired code. Please try again."
    }));
}
    // Success - Log in
    user.otp = null; user.otpExpires = null; await user.save();
    
    const token = jwt.sign(
      { userId: user._id, role: user.role, name: user.name, email: user.email, enrollment: user.enrollment },
      process.env.SESSION_SECRET || 'fallback_secret',
      { expiresIn: '1d' }
    );

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ 
      success: true, 
      message: "Student logged in successfully", 
      token,
      redirectUrl: '/student.html',
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        enrollment: user.enrollment,
        name: user.name
      }
    }));
} catch (err) {
console.error(err);
res.statusCode = 500;
res.setHeader('Content-Type', 'application/json');
return res.end(JSON.stringify({ success: false, error: "Server error verifying code." }));
}

});

// Render Initial Login Page
router.get('/login', (req, res) => {
  res.render('auth/login', { error: null });
});

// Logout
router.post('/logout', (req, res) => {
  // Frontend handles clearing localStorage, backend just confirms
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  return res.end(JSON.stringify({ success: true, message: 'Logged out successfully' }));
});

// Check session (JWT version)
router.get('/check', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ authenticated: false }));
  }

  jwt.verify(token, process.env.SESSION_SECRET || 'fallback_secret', async (err, decoded) => {
    if (err) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ authenticated: false }));
    }
    
    try {
      const user = await User.findById(decoded.userId);
      if (user) {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ 
          authenticated: true, 
          user: {
            id: user._id,
            email: user.email,
            role: user.role,
            enrollment: user.enrollment,
            name: user.name
          } 
        }));
      }
    } catch (e) {
      console.error('JWT check DB error:', e);
    }
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ authenticated: false }));
  });
});

module.exports = router;
