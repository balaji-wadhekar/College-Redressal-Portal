require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error.message);
        process.exit(1);
    }
};

const checkUsers = async () => {
    await connectDB();

    try {
        const users = await User.find({});

        if (users.length > 0) {
            console.log('\n--- Existing Users ---');
            users.forEach(user => {
                console.log(`Role: ${user.role} | Enrollment: ${user.enrollment} | Email: ${user.email}`);
            });
            console.log('\nUse one of the above Enrollment Numbers to login.');
            console.log('Note: I cannot show passwords as they are encrypted. If you don\'t know the password, I can reset one for you.');
        } else {
            console.log('\nNo users found. Creating a test student...');
            const testUser = new User({
                enrollment: '123456',
                password: 'password123',
                email: 'test@example.com',
                role: 'student',
                name: 'Test Student'
            });
            await testUser.save();
            console.log('\n✅ Test User Created!');
            console.log('Enrollment: 123456');
            console.log('Password: password123');
        }
    } catch (err) {
        console.error(err);
    } finally {
        mongoose.disconnect();
    }
};

checkUsers();
