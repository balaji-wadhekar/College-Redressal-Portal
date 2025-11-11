# 🪟 Windows Start Guide

## ✅ You've successfully installed and seeded the database!

The npm dev mode has an issue with your Windows environment, but we have simple solutions.

---

## 🚀 How to Start the Server

### **Option 1: Double-click the batch file (Easiest)**

1. Find the file `start-server.bat` in your project folder
2. Double-click it
3. A command window will open showing the server status
4. Open browser: `http://localhost:3000`

### **Option 2: Use PowerShell directly**

In your PowerShell terminal (where you are now), type:

```powershell
node server.js
```

Press Enter. You should see:

```
✅ MongoDB Connected: localhost
📊 Database: grievance_portal
🚀 Server running on http://localhost:3000
📝 Environment: development
```

### **Option 3: Use npm start**

```powershell
npm start
```

This runs the production version without nodemon.

---

## 🌐 Access the Application

Once the server is running:

1. Open your browser
2. Go to: `http://localhost:3000`
3. Login with demo credentials:
   - **Student**: student@gmail.com / 123
   - **Admin**: admin@gmail.com / admin

---

## 🔧 Why npm run dev didn't work?

The `npm run dev` command uses `nodemon` which requires `cmd.exe` access. Your Windows environment has a PATH configuration issue, but this doesn't affect the server functionality.

**Solutions if you want to fix it:**

1. **Restart PowerShell as Administrator**
2. Or just use `node server.js` which works perfectly fine!

---

## 🛑 How to Stop the Server

When the server is running:
- Press `Ctrl + C` in the terminal
- Or close the terminal window

---

## ✨ What to Test

### As Student (student@gmail.com / 123):
1. ✅ File a new complaint
2. ✅ View your complaints list
3. ✅ Delete a pending complaint
4. ✅ Use search and filters
5. ✅ Check your statistics

### As Admin (admin@gmail.com / admin):
1. ✅ View all complaints from all students
2. ✅ Change complaint status to "In Progress"
3. ✅ Mark complaints as "Resolved"
4. ✅ View system statistics
5. ✅ Filter by category and status
6. ✅ Check category breakdown

---

## 🎯 Quick Commands

```powershell
# Start server (use this!)
node server.js

# Or use npm start
npm start

# If you need to reseed the database
node scripts/seedDatabase.js
```

---

## 📝 Notes

- The server must be running for the website to work
- Keep the terminal/PowerShell window open while using the app
- Data is saved to MongoDB (not localStorage anymore)
- Session lasts 24 hours

---

## 🐛 Troubleshooting

### Server won't start?

**Check MongoDB is running:**
```powershell
net start MongoDB
```

### Port 3000 already in use?

Edit `.env` file and change:
```
PORT=3001
```

Then restart the server.

### Can't connect to MongoDB?

Make sure MongoDB is installed and running. Check:
```powershell
mongod --version
```

---

## 🎉 You're All Set!

Just run: `node server.js`

Then open: `http://localhost:3000`

**Happy Testing! 🚀**
