require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Complaint = require('../models/Complaint');

// Generate a random strong password
const generatePassword = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
};

const seedDatabase = async () => {
  try {
    await connectDB();

    // Clear existing data
    await User.deleteMany({});
    await Complaint.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Generate new password
    const newAdminPassword = generatePassword();

    // Create demo users with new admin password
    const studentUser = await User.create({
      email: 'student@gmail.com',
      password: '123',
      role: 'student',
      enrollment: 'STU2024001'
    });

    const adminUser = await User.create({
      email: 'admin@gmail.com',
      password: newAdminPassword,
      role: 'admin'
    });

    console.log('✅ Created demo users:');
    console.log('   Student: student@gmail.com / 123');
    console.log('   Admin: admin@gmail.com / ' + newAdminPassword);

    // Create sample complaints
    const sampleComplaints = [
      {
        title: 'Library Books Unavailable',
        category: 'Library',
        description: 'Required textbooks for Computer Science are not available in the library.',
        status: 'Pending',
        studentEmail: studentUser.email,
        studentId: studentUser._id,
        studentName: 'Demo Student',
        studentPhone: '9876543210',
        studentEnrollment: 'STU2024001',
        studentDept: 'Computer Science',
        studentYear: 'Second Year',
        incidentDate: new Date()
      },
      {
        title: 'Hostel WiFi Issues',
        category: 'Hostel',
        description: 'WiFi connectivity is very poor in Block A, especially during evening hours.',
        status: 'In Progress',
        studentEmail: studentUser.email,
        studentId: studentUser._id,
        studentName: 'Demo Student',
        studentPhone: '9876543210',
        studentEnrollment: 'STU2024001',
        studentDept: 'Computer Science',
        studentYear: 'Second Year',
        incidentDate: new Date()
      },
      {
        title: 'Exam Schedule Conflict',
        category: 'Exam',
        description: 'Two exams are scheduled at the same time slot for different subjects.',
        status: 'Resolved',
        studentEmail: studentUser.email,
        studentId: studentUser._id,
        studentName: 'Demo Student',
        studentPhone: '9876543210',
        studentEnrollment: 'STU2024001',
        studentDept: 'Computer Science',
        studentYear: 'Second Year',
        incidentDate: new Date()
      }
    ];

    await Complaint.insertMany(sampleComplaints);
    console.log('✅ Created sample complaints');

    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📝 NEW ADMIN CREDENTIALS:');
    console.log('   Email: admin@gmail.com');
    console.log('   Password: ' + newAdminPassword);

    process.exit(0);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
