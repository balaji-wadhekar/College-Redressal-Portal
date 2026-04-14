const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  trackingID: {
    type: String
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  category: {
    type: String,
    required: true,
    enum: [
      'Academic', 'Hostel', 'Hostel Mess', 'Exam', 'Infrastructure', 'Library', 'Canteen', 'Transport', 'Other',
      'General Grievance', 'Sexual Harassment', 'Ragging', 'Admission', 'Discrimination', 'Faculty Related',
      'Computer and Network', 'ERP', 'Maintenance', 'Student Section', 'Administration and HR',
      'Procurement and Inventory', 'Accounts', 'Training and Placement', 'Student Grievance', 'RO Plant'
    ]
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Resolved'],
    default: 'Pending'
  },
  incidentDate: {
    type: Date,
    required: true
  },
  studentEmail: {
    type: String,
    required: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Personal Information Fields
  studentName: { type: String },
  studentPhone: { type: String },
  studentEnrollment: { type: String }, // Redundant but requested for integrity snapshot
  studentDept: { type: String },
  studentYear: { type: String }, // Optional but often useful

  // Document Details
  docTitle: { type: String },
  docPath: { type: String },

  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

complaintSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Complaint', complaintSchema);
