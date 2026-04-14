require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB Connected');
    } catch (error) {
        console.error('❌ Error connecting to MongoDB:', error.message);
        process.exit(1);
    }
};

const createDemoUsers = async () => {
    try {
        await connectDB();

        console.log('🔄 ensuring demo users exist...');

        // 1. Admin User
        const adminData = {
            email: 'admin@demo.com',
            enrollment: 'ADMIN001',
            role: 'admin',
            name: 'Demo Admin',
            phone: '1234567890'
        };

        // We want to set the password. Since hashing happens in pre-save, we can't just findOneAndUpdate cleanly if we want to trigger the hook easily without loading, modifying, saving.
        // Actually, finding, updating fields, and saving is best to trigger pre-save hook for password.

        let admin = await User.findOne({ enrollment: adminData.enrollment });
        if (!admin) {
            admin = new User(adminData);
            console.log('   Creating new Admin user...');
        } else {
            console.log('   Updating existing Admin user...');
            admin.email = adminData.email; // Ensure email matches
            admin.role = adminData.role;
            admin.name = adminData.name;
        }
        admin.password = 'admin123'; // Set/Reset password
        await admin.save();
        console.log(`✅ Admin: Enrollment='${adminData.enrollment}', Password='admin123'`);


        // 2. Student User
        const studentData = {
            email: 'student@demo.com',
            enrollment: 'STU2024001',
            role: 'student',
            name: 'Demo Student',
            phone: '0987654321'
        };

        let student = await User.findOne({ enrollment: studentData.enrollment });
        if (!student) {
            student = new User(studentData);
            console.log('   Creating new Student user...');
        } else {
            console.log('   Updating existing Student user...');
            student.email = studentData.email;
            student.role = studentData.role;
            student.name = studentData.name;
        }
        student.password = 'student123';
        await student.save();
        console.log(`✅ Student: Enrollment='${studentData.enrollment}', Password='student123'`);

        console.log('\n🎉 Demo users ready!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error creating demo users:', error);
        process.exit(1);
    }
};

createDemoUsers();
