const mongoose = require('mongoose');
const Complaint = require('../models/Complaint');
const User = require('../models/User');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function verifySystem() {
    console.log('🔄 Starting Full System Verification...');

    try {
        // 1. Connect to Database
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGODB_URI);
            console.log('✅ Database Connected');
        }

        // 2. Create Dummy Student (if not exists)
        let student = await User.findOne({ email: 'test_verify@student.com' });
        if (!student) {
            student = await User.create({
                name: 'Verify Student',
                email: 'test_verify@student.com',
                password: 'hashedpassword123',
                role: 'student',
                enrollment: 'VERIFY001',
                phone: '9998887776'
            });
            console.log('✅ Generated Test Student');
        }

        // 3. Simulate Form Data
        const complaintData = {
            title: 'Verification Test Grievance',
            category: 'General Grievance', // This caused error before
            description: 'Testing full flow with General Grievance category',
            incidentDate: new Date(),
            studentEmail: student.email,
            studentId: student._id,
            studentName: student.name,
            studentPhone: student.phone || '9998887776',
            studentEnrollment: student.enrollment,
            studentDept: 'Computer Engineering',
            docTitle: 'Test Proof',
            docPath: 'uploads/test_file.txt', // Simulate uploaded file path
            status: 'Pending'
        };

        // 4. Attempt to Create Complaint (Directly using Model to test Schema validation)
        const complaint = new Complaint(complaintData);
        await complaint.save();
        console.log(`✅ Complaint Created Successfully (ID: ${complaint._id})`);
        console.log('   - Schema Validation Passed (Category: General Grievance)');

        // 5. Verify Retrieval (Admin View)
        const retrieved = await Complaint.findById(complaint._id);
        if (retrieved && retrieved.category === 'General Grievance') {
            console.log('✅ Admin Retrieval Verified: Data matches');
        } else {
            console.error('❌ Data Mismatch on Retrieval');
        }

        // 6. Cleanup
        await Complaint.findByIdAndDelete(complaint._id);
        console.log('✅ Cleanup: Test complaint deleted');

        console.log('\n🎉 SYSTEM VERIFICATION PASSED!');
        process.exit(0);

    } catch (error) {
        console.error('\n❌ VERIFICATION FAILED:', error.message);
        if (error.errors && error.errors.category) {
            console.error('   👉 Specific Error: Category Enum Validation Failed!');
            console.error('   👉 Allowed Values:', error.errors.category.properties.enumValues);
        }
        process.exit(1);
    }
}

verifySystem();
