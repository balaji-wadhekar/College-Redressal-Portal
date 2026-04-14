const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.get('/manage-users', async (req, res) => {
try {
// Fetch all users with the role of 'student' from the database
const students = await User.find({ role: 'student' }).sort({ createdAt: -1 });

    // Render the EJS view and pass the students array and any query parameters (like success messages)
    res.render('admin/manage_users', { 
        students: students,
        success: req.query.success,
        count: req.query.count
    });
} catch (err) {
    console.error(err);
    // FALLBACK IF EJS IS NOT CONFIGURED:
    if (err.message && err.message.includes('No default engine was specified')) {
        return res.redirect(`/manage-users.html?success=${req.query.success || ''}&count=${req.query.count || ''}`);
    }
    res.status(500).send("Server Error");
}
});

module.exports = router;
