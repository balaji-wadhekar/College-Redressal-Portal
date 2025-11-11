# 👥 User Management System Guide

## ✅ Complete User Management Features Implemented!

Your College Grievance Portal now has a complete admin-controlled user management system.

---

## 🎯 What's New

### **Admin Features:**
1. ✅ **Manual Student Addition** - Add students one by one
2. ✅ **Bulk CSV Upload** - Upload multiple students at once
3. ✅ **Auto Password Generation** - System generates secure random passwords
4. ✅ **View All Users** - See all students with their details
5. ✅ **Reset Password** - Generate new password for any student
6. ✅ **Delete Users** - Remove students from the system
7. ✅ **Download Credentials** - Export student login credentials

### **Login System:**
- ✅ Students login with **Enrollment Number** (not email)
- ✅ Enrollment number is the username (e.g., ADT25SOCBD089)
- ✅ System-generated secure passwords
- ✅ No self-registration - only admin can add users

---

## 📋 How to Use

### **Step 1: Install New Dependencies**

```bash
npm install
```

This installs:
- `multer` - File upload handling
- `csv-parser` - CSV file parsing

### **Step 2: Start the Server**

```bash
node server.js
```

### **Step 3: Login as Admin**

- Go to: `http://localhost:3000`
- Username: `admin@gmail.com`
- Password: `admin`

### **Step 4: Access User Management**

Click the **"Manage Users"** button in the admin dashboard.

---

## 👤 Adding Students

### **Method 1: Add Single Student**

1. Go to **Manage Users** page
2. Fill in the form:
   - **Enrollment Number**: e.g., `ADT25SOCBD089`
   - **Name**: e.g., `John Doe`
3. Click **"Add Student"**
4. System shows generated credentials:
   - Username: `ADT25SOCBD089`
   - Password: `Randomly generated`
5. **Save these credentials!** They cannot be retrieved later.
6. Click **"Copy Credentials"** to copy them.

### **Method 2: Bulk Upload via CSV**

1. Download the sample CSV template
2. Open in Excel or any spreadsheet software
3. Fill in columns:
   - `enrollment` - Student enrollment numbers
   - `name` - Student names
4. Save as CSV file
5. Upload the file
6. System processes all students and shows:
   - Success count
   - Generated credentials for all students
   - Any errors
7. Click **"Download Credentials"** to export all passwords

**Sample CSV Format:**
```csv
enrollment,name
ADT25SOCBD001,John Doe
ADT25SOCBD002,Jane Smith
ADT25SOCBD003,Bob Johnson
```

---

## 🔑 Student Login Process

1. Student goes to: `http://localhost:3000`
2. Enters:
   - **Username**: Enrollment Number (e.g., `ADT25SOCBD089`)
   - **Password**: Password given by admin
3. Clicks **"Login to Portal"**
4. Redirected to Student Dashboard

---

## 🔧 Managing Students

### **View All Students:**
- See all registered students
- Search by enrollment or name
- View registration date

### **Reset Password:**
1. Find the student in the list
2. Click **"Reset Password"**
3. Confirm the action
4. System generates new password
5. Alert shows the new password
6. Password is automatically copied to clipboard
7. Share new password with student

### **Delete Student:**
1. Find the student in the list
2. Click **"Delete"**
3. Confirm deletion
4. Student and all their complaints are removed

---

## 📊 Features Breakdown

### **Password Generation:**
- **Length**: 10 characters
- **Characters**: Letters (mixed case), numbers, special chars (@#$)
- **Format**: `Aa2@Bb3#Cc4`
- **Security**: Random and unpredictable

### **Enrollment Number Format:**
- Used as username
- Case-insensitive (automatically converted to uppercase)
- Example: `ADT25SOCBD089`
- No duplicates allowed

### **Data Stored:**
- Enrollment Number
- Student Name
- Email (same as enrollment for login)
- Hashed Password
- Registration Date

---

## 🔐 Security Features

1. ✅ **No Self-Registration** - Only admin can add users
2. ✅ **Password Hashing** - Passwords encrypted with bcrypt
3. ✅ **One-Time Display** - Passwords shown only once during creation
4. ✅ **Admin-Only Access** - All user management requires admin login
5. ✅ **Session-Based Auth** - Secure session management

---

## 📥 CSV Upload Details

### **Required Columns:**
- `enrollment` (or `EnrollmentNumber` or `ENROLLMENT`)
- `name` (or `Name` or `NAME`)

### **Process:**
1. File uploaded to server
2. CSV parsed row by row
3. Each student checked for duplicates
4. Password generated for each
5. User created in database
6. Results compiled (success + errors)
7. Credentials list generated
8. Uploaded file deleted from server

### **Error Handling:**
- Duplicate enrollments skipped
- Missing data flagged
- Detailed error report provided

---

## 🎯 API Endpoints

### **User Management:**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/users` | GET | Get all students (admin) |
| `/api/users/add` | POST | Add single student (admin) |
| `/api/users/bulk-upload` | POST | Upload CSV (admin) |
| `/api/users/:id` | DELETE | Delete student (admin) |
| `/api/users/:id/reset-password` | POST | Reset password (admin) |

---

## 📁 New Files Created

1. **`routes/users.js`** - User management API routes
2. **`manage-users.html`** - Admin user management page
3. **`public/manage-users.js`** - Frontend logic
4. **`uploads/`** - Temporary CSV file storage

---

## 🔄 Migration from Old System

If you have existing students in the database with email logins:

1. They can still login with their email
2. Add new students using enrollment numbers
3. Gradually migrate old users by:
   - Deleting old account
   - Re-adding with enrollment number

---

## ⚠️ Important Notes

### **Password Management:**
- Passwords cannot be retrieved after creation
- Admin must save/distribute immediately
- Use reset function if password lost

### **Backup:**
- Export credentials after bulk upload
- Keep CSV files of generated passwords
- Store securely (not in git repository)

### **Best Practices:**
1. Add students before semester starts
2. Distribute credentials securely
3. Advise students to remember their passwords
4. Use bulk upload for large batches
5. Test with a few students first

---

## 🎉 Usage Workflow

### **Start of Semester:**
1. Admin receives list of new students
2. Prepare CSV file with enrollments and names
3. Bulk upload via manage-users page
4. Download generated credentials
5. Print/email credentials to students
6. Students login and use the portal

### **Mid-Semester:**
1. New student joins
2. Admin adds manually
3. Shares credentials with student

### **Password Issues:**
1. Student forgets password
2. Contact admin
3. Admin resets password
4. New password shared with student

---

## 🚀 Testing

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start server:**
   ```bash
   node server.js
   ```

3. **Login as admin:**
   - http://localhost:3000
   - admin@gmail.com / admin

4. **Add a test student:**
   - Go to Manage Users
   - Add: ADT25TEST001 / Test Student
   - Save the generated password

5. **Test student login:**
   - Logout
   - Login with: ADT25TEST001 / [generated password]
   - Should access student dashboard

---

## 📞 Support

For issues:
1. Check browser console for errors
2. Check server console for API errors
3. Verify MongoDB is running
4. Ensure all dependencies installed

---

**User management system is now fully operational!** 🎓✅
