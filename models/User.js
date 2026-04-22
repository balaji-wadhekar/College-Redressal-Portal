const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const validDepartments = [
  "MIT School of Engineering and Science",
  "MIT School of Computing",
  "MIT School of Bioengineering Sciences and Research",
  "MIT College of Management",
  "MIT School of Film & Theatre",
  "MIT School of Fine Arts",
  "MIT School of Architecture",
  "MIT School of Education & Research",
  "MIT School of Humanities",
  "MIT School of Vedic Sciences",
  "MIT School of Food Technology",
  "MIT-VSKA (Sangeet Kala Academy)",
  "MIT-Indian Civil Services",
  "MIT-Maharashtra Academy of Naval Education and Training",
  "MIT-School of Law",
  "HR",
  "Admin",
  "Account"
];

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  otp: {
    type: String,
    default: null
  },
  password: {
    type: String,
    required: true
  },
  otpExpires: {
    type: Date,
    default: null
  },
  role: {
    type: String,
    enum: ['student', 'admin'],
    required: true
  },
  enrollment: {
    type: String,
    default: 'N/A'
  },
  name: {
    type: String,
    default: ''
  },
  department: { type: String, enum: validDepartments, default: null },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);