const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.get('/manage-users', async (req, res) => {
    try {
        // Count the total number of students in the database
        const activeCount = await User.countDocuments({ role: 'student' });
        
        res.render('admin/manage_users', { 
            activeUsers: activeCount
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});

router.post('/magic-roster', async (req, res) => {
    try {
        const bcrypt = require('bcryptjs'); // Need bcrypt to prevent schema violations on password

        const demoStudents = [
            { name: 'Aditya Patil', enrollment: 'CSE2026-10', role: 'student' },
            { name: 'Priya Sharma', enrollment: 'CSE2026-11', role: 'student' },
            { name: 'Rahul Verma', enrollment: 'CSE2026-12', role: 'student' }
        ];

        for (const student of demoStudents) {
            const hashedPassword = await bcrypt.hash(student.enrollment, 10);
            
            await User.findOneAndUpdate(
                { enrollment: student.enrollment },
                { 
                    ...student, 
                    email: student.enrollment.toLowerCase(),
                    password: hashedPassword 
                },
                { upsert: true, new: true }
            );
        }
        res.redirect('/admin/manage-users?success=true');
    } catch (err) {
        console.error(err);
        res.status(500).send("Magic injection failed");
    }
});

module.exports = router;
