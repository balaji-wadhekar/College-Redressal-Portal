# 🚀 MongoDB Setup Guide

This guide will help you set up MongoDB and run the College Grievance Portal with database integration.

## Prerequisites

1. **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
2. **MongoDB** (v4.4 or higher) - [Download](https://www.mongodb.com/try/download/community)

## Installation Steps

### 1. Install MongoDB

#### Windows:
1. Download MongoDB Community Server from [MongoDB Download Center](https://www.mongodb.com/try/download/community)
2. Run the installer (`.msi` file)
3. Choose "Complete" installation
4. Install as a Windows Service (recommended)
5. MongoDB will start automatically

#### Verify MongoDB Installation:
```bash
mongod --version
```

### 2. Install Project Dependencies

Open terminal/command prompt in the project folder:

```bash
npm install
```

This will install all required packages:
- express (web server)
- mongoose (MongoDB ODM)
- bcryptjs (password hashing)
- express-session (session management)
- connect-mongo (MongoDB session store)
- cors (Cross-Origin Resource Sharing)
- dotenv (environment variables)

### 3. Configure Environment Variables

The `.env` file is already created with default settings:

```
MONGODB_URI=mongodb://localhost:27017/grievance_portal
PORT=3000
NODE_ENV=development
SESSION_SECRET=grievance-portal-secret-key-2024
```

**For production**, update `SESSION_SECRET` to a random secure string.

### 4. Start MongoDB

#### Windows (if not running as service):
```bash
mongod
```

#### Check if MongoDB is running:
```bash
mongo --eval "db.version()"
```

### 5. Seed the Database

Create demo users and sample data:

```bash
node scripts/seedDatabase.js
```

This creates:
- **Student Account**: student@gmail.com / 123
- **Admin Account**: admin@gmail.com / admin
- **Sample Complaints**: 3 demo complaints for testing

### 6. Start the Server

#### Development Mode (with auto-reload):
```bash
npm run dev
```

#### Production Mode:
```bash
npm start
```

You should see:
```
✅ MongoDB Connected: localhost
📊 Database: grievance_portal
🚀 Server running on http://localhost:3000
📝 Environment: development
```

### 7. Access the Application

Open your browser and navigate to:
```
http://localhost:3000
```

## 📋 Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start server in production mode |
| `npm run dev` | Start server with nodemon (auto-reload) |
| `node scripts/seedDatabase.js` | Reset and seed database with demo data |

## 🔧 Troubleshooting

### MongoDB Connection Failed

**Error**: `MongooseServerSelectionError: connect ECONNREFUSED`

**Solutions**:
1. Make sure MongoDB is running: `mongod`
2. Check if MongoDB is listening on port 27017
3. Verify MONGODB_URI in `.env` file

### Port Already in Use

**Error**: `EADDRINUSE: address already in use :::3000`

**Solutions**:
1. Change PORT in `.env` file to another port (e.g., 3001)
2. Or kill the process using port 3000:
   ```bash
   # Windows
   netstat -ano | findstr :3000
   taskkill /PID <PID> /F
   
   # Linux/Mac
   lsof -ti:3000 | xargs kill
   ```

### Cannot Find Module

**Error**: `Cannot find module 'express'`

**Solution**: Run `npm install` again

## 📊 Database Structure

### Collections

1. **users**
   - email (unique)
   - password (hashed)
   - role (student/admin)
   - enrollment
   - createdAt

2. **complaints**
   - title
   - category
   - description
   - status (Pending/In Progress/Resolved)
   - studentEmail
   - studentId (ref to User)
   - createdAt
   - updatedAt

3. **sessions** (managed by connect-mongo)

## 🔐 Security Notes

- Passwords are hashed using bcryptjs before storing
- Sessions are stored in MongoDB, not in memory
- CORS is enabled for API access
- For production:
  - Use strong SESSION_SECRET
  - Enable HTTPS
  - Add rate limiting
  - Validate all inputs
  - Set secure cookie options

## 📝 API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `POST /api/auth/register` - Register new user
- `GET /api/auth/check` - Check session

### Complaints
- `GET /api/complaints` - Get all complaints (filtered by role)
- `GET /api/complaints/:id` - Get single complaint
- `POST /api/complaints` - Create complaint (student only)
- `PATCH /api/complaints/:id/status` - Update status (admin only)
- `DELETE /api/complaints/:id` - Delete complaint
- `GET /api/complaints/stats/summary` - Get statistics

## 🎯 Next Steps

1. ✅ Install MongoDB
2. ✅ Run `npm install`
3. ✅ Start MongoDB
4. ✅ Seed database: `node scripts/seedDatabase.js`
5. ✅ Start server: `npm run dev`
6. ✅ Open browser: `http://localhost:3000`
7. ✅ Login and test!

---

**Need Help?** Check the [README.md](README.md) for more information about the application features.
