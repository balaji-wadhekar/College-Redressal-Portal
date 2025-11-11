# ⚡ Quick Start Guide

Get the College Grievance Portal running in 5 minutes!

## Step 1: Install MongoDB

### Windows:
Download and install from: https://www.mongodb.com/try/download/community

✅ Choose "Complete" installation
✅ Install as Windows Service

## Step 2: Install Dependencies

Open terminal in project folder:

```bash
npm install
```

Wait for all packages to install...

## Step 3: Seed Database

Create demo users and sample data:

```bash
node scripts/seedDatabase.js
```

You should see:
```
✅ MongoDB Connected
🗑️  Cleared existing data
✅ Created demo users:
   Student: student@gmail.com / 123
   Admin: admin@gmail.com / admin
✅ Created sample complaints
🎉 Database seeded successfully!
```

## Step 4: Start Server

```bash
npm start
```

Or for development with auto-reload:

```bash
npm run dev
```

You should see:
```
✅ MongoDB Connected: localhost
📊 Database: grievance_portal
🚀 Server running on http://localhost:3000
```

## Step 5: Open Browser

Navigate to: **http://localhost:3000**

## Step 6: Login

Use demo credentials:

### Student Account:
- **Email**: student@gmail.com
- **Password**: 123

### Admin Account:
- **Email**: admin@gmail.com
- **Password**: admin

## 🎉 That's it!

You're now ready to use the application!

### What to Try:

**As Student:**
- File a new complaint
- View your complaints
- Delete pending complaints
- Search and filter

**As Admin:**
- View all complaints
- Update complaint status
- View statistics
- Filter by category/status

---

## 🔧 Troubleshooting

### MongoDB not running?

**Windows:**
```bash
net start MongoDB
```

Or start manually:
```bash
mongod
```

### Port 3000 already in use?

Edit `.env` file and change:
```
PORT=3001
```

Then restart the server.

### Need more help?

Check the detailed guides:
- [SETUP.md](SETUP.md) - Complete setup instructions
- [README.md](README.md) - Full documentation

---

**Happy Testing! 🚀**
