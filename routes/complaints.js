const express = require('express');
const router = express.Router();
const Complaint = require('../models/Complaint');
const mult = require('multer');
const path = require('path');
const { sendStatusUpdateEmail, transporter } = require('../utils/emailService');

// Configure Multer for file uploads
const storage = mult.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    // Generate unique filename: id-timestamp.ext
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = mult({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
};

// Get all complaints (filtered by role)
router.get('/', isAuthenticated, async (req, res) => {
  try {
    let query = {};
    if (req.session.user.role === 'student') {
      // Filter strictly for the logged-in student
      query.studentId = req.session.user.id;
    }
    
    const complaints = await Complaint.find(query).sort({ createdAt: -1 });

    res.json({
      success: true,
      complaints
    });
  } catch (error) {
    console.error('Get complaints error:', error);
    res.status(500).json({ error: 'Failed to fetch complaints' });
  }
});

// Get specific complaint
router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    if (req.session.user.role !== 'admin' && complaint.studentId.toString() !== req.session.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ success: true, complaint });
  } catch (error) {
    console.error('Get complaint error:', error);
    res.status(500).json({ error: 'Failed to fetch complaint' });
  }
});

// Create new complaint (student only)
// Note: 'docFile' matches the form field name
router.post('/', isAuthenticated, upload.single('docFile'), async (req, res) => {
  try {
    if (req.session.user.role !== 'student') {
      return res.status(403).json({ error: 'Only students can file complaints' });
    }

    const {
      title, category, description, incidentDate,
      studentName, studentPhone, studentEnrollment, studentDept, studentEmail,
      docTitle
    } = req.body;

    // Only check the essential grievance fields
    if (!title || !category || !description) {
      return res.status(400).json({ error: "Title, Category, and Description are required to submit a grievance." });
    }

    // Generate a unique trackingID (e.g., GRV-A1B2C3)
    const randomString = require('crypto').randomBytes(3).toString('hex').toUpperCase();
    const trackingID = `GRV-${randomString}`;

    const complaint = new Complaint({
      trackingID,
      title,
      category,
      description,
      incidentDate,
      studentEmail: studentEmail || req.session.user.email,
      studentId: req.session.user.id,
      // Personal Info
      studentName,
      studentPhone,
      studentEnrollment,
      studentDept,
      // Document Details
      docTitle: docTitle || '',
      docPath: req.file ? req.file.filename : null // Save file path if file exists
    });

    await complaint.save();

    // --- EMAIL ROUTING ENGINE ---
    const categoryRouting = {
      "Sexual Harassment": "vaishnvikatkade690@gmail.com",
      "Ragging": "vaishnvikatkade690@gmail.com",
      "Discrimination": "vaishnvikatkade690@gmail.com",
      "Student Grievance": "vaishnvikatkade690@gmail.com",
      "General Grievance": "vaishnvikatkade690@gmail.com",

      "Hostel": "mauliphad76@gmail.com",
      "Hostel Mess": "mauliphad76@gmail.com",
      "Maintenance": "mauliphad76@gmail.com",
      "Transport": "mauliphad76@gmail.com",
      "RO Plant": "mauliphad76@gmail.com",
      
      "Computer and Network": "wadhekarbalaji56@gmail.com",
      "ERP": "wadhekarbalaji56@gmail.com",
      "Library": "wadhekarbalaji56@gmail.com",
      "Faculty Related": "wadhekarbalaji56@gmail.com",
      "Training and Placement": "wadhekarbalaji56@gmail.com",

      "Admission": "wadhekarba@gmail.com",
      "Student Section": "wadhekarba@gmail.com",
      "Administration and HR": "wadhekarba@gmail.com",
      "Procurement and Inventory": "wadhekarba@gmail.com",
      "Accounts": "wadhekarba@gmail.com",
      "Other": "wadhekarba@gmail.com"
    };
    const targetAdminEmail = categoryRouting[category] || "wadhekarba@gmail.com";

    // 1. Check for Document and Setup Inline Embedding (CID)
    let documentHTML = `<p><strong>Attached Evidence:</strong> None provided.</p>`;
    let emailAttachments = [];

    if (complaint.docPath) {
      // The uploads dir is in the root directory, not public/uploads
      const filePath = path.join(__dirname, '../uploads', complaint.docPath);

      // Check if it is an image to display inline
      if (complaint.docPath.match(/\.(jpg|jpeg|png|gif)$/i)) {
        emailAttachments.push({
            filename: complaint.docPath,
            path: filePath,
            cid: 'evidence_image' // This binds the attachment to the HTML img tag
        });
        documentHTML = `
            <h3 style="color: #374151; margin-top: 0; border-bottom: 2px solid #d1d5db; padding-bottom: 5px;">3. Attached Evidence</h3>
            <div style="background-color: #f3f4f6; padding: 10px; text-align: center; border-radius: 5px;">
                <img src="cid:evidence_image" style="max-width: 100%; height: auto; border: 1px solid #ccc; border-radius: 4px;" alt="Grievance Evidence" />
            </div>
        `;
      } else {
        // If it's a PDF or other file type, attach it normally
        emailAttachments.push({
            filename: complaint.docPath,
            path: filePath
        });
        documentHTML = `
            <h3 style="color: #374151; margin-top: 0; border-bottom: 2px solid #d1d5db; padding-bottom: 5px;">3. Attached Evidence</h3>
            <p>📄 A document is attached to this email. Please download it to view.</p>
        `;
      }
    }

    // 2. Format the Comprehensive Email HTML
    const emailHTML = `
    <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
    <div style="background-color: #1f2937; color: white; padding: 20px; text-align: center;">
    <h2 style="margin: 0;">Urgent: New Grievance Submitted</h2>
    <p style="margin: 5px 0 0 0; color: #9ca3af;">Action Required: ${category}</p>
    </div>

        <div style="padding: 20px; background-color: #f9fafb; border-bottom: 1px solid #e5e7eb;">
            <h3 style="color: #374151; margin-top: 0; border-bottom: 2px solid #d1d5db; padding-bottom: 5px;">1. Student Information</h3>
            <p><strong>Name:</strong> ${req.session.user ? req.session.user.name : 'System User'}</p>
            <p><strong>Enrollment Number:</strong> ${req.session.user ? req.session.user.enrollment : 'Unknown'}</p>
            <p><strong>Submission Date:</strong> ${new Date().toLocaleString()}</p>
        </div>
        
        <div style="padding: 20px; background-color: white;">
            <h3 style="color: #374151; margin-top: 0; border-bottom: 2px solid #d1d5db; padding-bottom: 5px;">2. Grievance Details</h3>
            <p><strong>System Tracking ID:</strong> ${complaint.trackingID}</p>
            <p><strong>Title:</strong> ${req.body.title || 'N/A'}</p>
            <p><strong>Category:</strong> ${category}</p>
            <p><strong>Full Description:</strong></p>
            <div style="background-color: #fffbdd; padding: 15px; border-left: 4px solid #f59e0b; color: #111827; white-space: pre-wrap; font-size: 14px; line-height: 1.5;">${description}</div>
        </div>
        
        <div style="padding: 20px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
            ${documentHTML}
        </div>
    </div>
    `;

    // 3. Dispatch the Email with Attachments
    try {
      await transporter.sendMail({
        from: '"MIT Grievance Portal" <no-reply@college.edu>',
        to: targetAdminEmail,
        subject: `[${category}] ${req.body.title || 'New Grievance'} - ${req.session.user ? req.session.user.enrollment : ''}`,
        html: emailHTML,
        attachments: emailAttachments
      });
      console.log(`✅ Routed comprehensive email (with attachments) to: ${targetAdminEmail}`);
    } catch (mailError) {
      console.error("⚠️ Email routing failed:", mailError);
    }

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

    // === AGGRESSIVE LOGGING INJECTED HERE ===
    console.log('--- DEBUG EMAIL TRIGGER ---');
    console.log('Found Grievance:', complaint.trackingID || ('#' + complaint._id.toString().substring(18)));
    console.log('Student Email:', complaint.studentEmail || 'N/A');
    console.log('Student Name:', complaint.studentName || 'N/A');
    // ========================================

    // Attempt to send the automated email notification
    if (status === 'In Progress' || status === 'Resolved') {
      try {
        await sendStatusUpdateEmail(
          complaint.studentEmail, 
          complaint.studentName, 
          complaint.trackingID || ('#' + complaint._id.toString().substring(18)), 
          status
        );
      } catch (emailError) {
        // Output specific Nodemailer failure reason
        console.error('NODEMAILER ERROR:', emailError);
      }
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

// Update an existing complaint (student only, and only if pending)
router.put('/:id', isAuthenticated, upload.single('docFile'), async (req, res) => {
  try {
    if (req.session.user.role !== 'student') {
      return res.status(403).json({ error: 'Only students can edit complaints' });
    }

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    if (complaint.studentId.toString() !== req.session.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (complaint.status !== 'Pending') {
      return res.status(400).json({ error: 'Only pending complaints can be edited' });
    }

    const { title, category, description } = req.body;
    if (title) complaint.title = title;
    if (category) complaint.category = category;
    if (description) complaint.description = description;
    
    if (req.file) {
      complaint.docPath = req.file.filename;
      if (req.body.docTitle) complaint.docTitle = req.body.docTitle;
    }

    complaint.updatedAt = Date.now();
    await complaint.save();

    // --- 2. Category Routing Engine ---
    const categoryRouting = {
        "Sexual Harassment": "vaishnvikatkade690@gmail.com",
        "Ragging": "vaishnvikatkade690@gmail.com",
        "Discrimination": "vaishnvikatkade690@gmail.com",
        "Student Grievance": "vaishnvikatkade690@gmail.com",
        "General Grievance": "vaishnvikatkade690@gmail.com",
        "Hostel": "mauliphad76@gmail.com",
        "Hostel Mess": "mauliphad76@gmail.com",
        "Maintenance": "mauliphad76@gmail.com",
        "Transport": "mauliphad76@gmail.com",
        "RO Plant": "mauliphad76@gmail.com",
        "Computer and Network": "wadhekarbalaji56@gmail.com",
        "ERP": "wadhekarbalaji56@gmail.com",
        "Library": "wadhekarbalaji56@gmail.com",
        "Faculty Related": "wadhekarbalaji56@gmail.com",
        "Training and Placement": "wadhekarbalaji56@gmail.com",
        "Admission": "wadhekarba@gmail.com",
        "Student Section": "wadhekarba@gmail.com",
        "Administration and HR": "wadhekarba@gmail.com",
        "Procurement and Inventory": "wadhekarba@gmail.com",
        "Accounts": "wadhekarba@gmail.com",
        "Other": "wadhekarba@gmail.com"
    };
    const targetAdminEmail = categoryRouting[complaint.category] || "wadhekarba@gmail.com";

    // --- 3. Document CID Embedding ---
    let documentHTML = `<p><strong>Attached Evidence:</strong> None provided.</p>`;
    let emailAttachments = [];

    if (complaint.docPath) {
        const filePath = path.join(__dirname, '../uploads', complaint.docPath); 
        if (complaint.docPath.match(/\.(jpg|jpeg|png|gif)$/i)) {
            emailAttachments.push({
                filename: complaint.docPath,
                path: filePath,
                cid: 'evidence_image'
            });
            documentHTML = `
                <h3 style="color: #374151; margin-top: 0; border-bottom: 2px solid #d1d5db; padding-bottom: 5px;">3. Attached Evidence</h3>
                <div style="background-color: #f3f4f6; padding: 10px; text-align: center; border-radius: 5px;">
                    <img src="cid:evidence_image" style="max-width: 100%; height: auto; border: 1px solid #ccc; border-radius: 4px;" alt="Grievance Evidence" />
                </div>
            `;
        } else {
            emailAttachments.push({ filename: complaint.docPath, path: filePath });
            documentHTML = `<h3 style="color: #374151; margin-top: 0; border-bottom: 2px solid #d1d5db; padding-bottom: 5px;">3. Attached Evidence</h3><p>📄 A document is attached to this email.</p>`;
        }
    }

    // --- 4. Formatted HTML for UPDATE Notification ---
    const emailHTML = `
        <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #d97706; color: white; padding: 20px; text-align: center;">
                <h2 style="margin: 0;">⚠️ Grievance Record UPDATED</h2>
                <p style="margin: 5px 0 0 0; color: #fef3c7;">The student has modified their submission.</p>
            </div>
            <div style="padding: 20px; background-color: #f9fafb; border-bottom: 1px solid #e5e7eb;">
                <h3 style="color: #374151; margin-top: 0; border-bottom: 2px solid #d1d5db; padding-bottom: 5px;">1. Student Information</h3>
                <p><strong>Name:</strong> ${req.session.user ? req.session.user.name : 'System User'}</p>
                <p><strong>Enrollment Number:</strong> ${req.session.user ? req.session.user.enrollment : 'Unknown'}</p>
                <p><strong>Last Modified:</strong> ${new Date().toLocaleString()}</p>
            </div>
            <div style="padding: 20px; background-color: white;">
                <h3 style="color: #374151; margin-top: 0; border-bottom: 2px solid #d1d5db; padding-bottom: 5px;">2. Updated Grievance Details</h3>
                <p><strong>System Tracking ID:</strong> ${complaint.trackingID || complaint._id}</p>
                <p><strong>Title:</strong> ${complaint.title || 'N/A'}</p>
                <p><strong>Category:</strong> ${complaint.category}</p>
                <p><strong>Full Description:</strong></p>
                <div style="background-color: #fffbdd; padding: 15px; border-left: 4px solid #f59e0b; color: #111827; white-space: pre-wrap; font-size: 14px; line-height: 1.5;">${complaint.description}</div>
            </div>
            <div style="padding: 20px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
                ${documentHTML}
            </div>
        </div>
    `;

    // --- 5. Dispatch the Update Email ---
    try {
        await transporter.sendMail({
            from: '"MIT Grievance Portal" <no-reply@college.edu>',
            to: targetAdminEmail,
            subject: `[UPDATED] ${complaint.title || 'Grievance Update'} - ${req.session.user ? req.session.user.enrollment : ''}`,
            html: emailHTML,
            attachments: emailAttachments
        });
        console.log(`✅ Routed UPDATE email to: ${targetAdminEmail}`);
    } catch (mailError) {
        console.error("⚠️ Email routing failed on edit:", mailError);
    }

    res.json({
      success: true,
      message: 'Complaint updated successfully',
      complaint
    });

  } catch (error) {
    console.error('Update complaint error:', error);
    res.status(500).json({ error: 'Failed to update complaint' });
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
