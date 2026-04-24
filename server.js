require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/database');

const app = express();

// Connect to MongoDB
connectDB();

// View engine configuration
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: true,
  credentials: true
}));

// MUST be before other middleware if using trust proxy
app.set('trust proxy', 1);


// Serve static files from public/
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/complaints', require('./routes/complaints'));

app.use('/admin', require('./routes/admin'));
app.use('/student', require('./routes/student'));

// Serve HTML pages
app.get('/', (req, res) => {
  res.render('auth/login');
});

app.get('/student.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'student.html'));
});

app.get('/admin.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});



// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server only when running directly (not on Vercel)
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

// Export app for Vercel serverless
module.exports = app;
