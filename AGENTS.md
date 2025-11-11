# 🤖 AI Agent Documentation - College Grievance Redressal Portal

## 📋 Project Overview

**College Grievance Redressal Portal** is a full-stack web application built with Node.js/Express backend and MongoDB database. It provides a comprehensive system for students to file complaints and administrators to manage and resolve grievances efficiently.

### 🎯 Core Purpose
- Streamline complaint management in educational institutions
- Provide transparent grievance redressal process
- Enable real-time tracking and status updates
- Facilitate communication between students and administration

---

## 🏗️ System Architecture

### Backend Architecture
```
Express Server (server.js)
├── Middleware Layer
│   ├── CORS Configuration
│   ├── Session Management (express-session + MongoDB store)
│   ├── JSON Body Parsing
│   └── Static File Serving
├── Route Layer
│   ├── /api/auth (Authentication)
│   ├── /api/complaints (Complaint Management)
│   └── /api/users (User Management)
├── Model Layer
│   ├── User Model (Authentication & Authorization)
│   └── Complaint Model (Grievance Data)
└── Database Layer (MongoDB via Mongoose)
```

### Frontend Architecture
```
HTML Pages
├── index.html (Login Page)
├── student.html (Student Dashboard)
├── admin.html (Admin Dashboard)
└── manage-users.html (User Management)

JavaScript Modules
├── public/api.js (API Communication Layer)
└── public/script.js (Business Logic & UI)
```

---

## 🔧 Technology Stack

### Backend Technologies
- **Node.js** - Server runtime environment
- **Express.js** - Web application framework
- **MongoDB** - NoSQL document database
- **Mongoose** - MongoDB Object Document Mapper (ODM)
- **bcryptjs** - Password hashing and security
- **express-session** - Session management
- **connect-mongo** - MongoDB session store
- **multer** - File upload handling for CSV imports
- **csv-parser** - CSV file parsing for bulk operations

### Frontend Technologies
- **HTML5** - Semantic markup structure
- **CSS3** - Modern styling with gradients and animations
- **Vanilla JavaScript** - No framework dependencies
- **Fetch API** - Modern AJAX for API communication

---

## 📊 Data Models

### User Model (`models/User.js`)
```javascript
{
  email: String (required, unique, lowercase),
  password: String (required, hashed with bcrypt),
  role: String (enum: ['student', 'admin']),
  enrollment: String (default: 'N/A'),
  name: String (default: ''),
  createdAt: Date (default: Date.now)
}
```

### Complaint Model (`models/Complaint.js`)
```javascript
{
  title: String (required, max: 100 characters),
  category: String (required, enum: 8 categories),
  description: String (required, max: 500 characters),
  status: String (enum: ['Pending', 'In Progress', 'Resolved']),
  studentEmail: String (required),
  studentId: ObjectId (reference to User),
  createdAt: Date (default: Date.now),
  updatedAt: Date (default: Date.now)
}
```

---

## 🌐 API Endpoints

### Authentication Routes (`/api/auth`)
- `POST /login` - User authentication
- `POST /logout` - Session termination
- `GET /check` - Session validation
- `POST /register` - User registration (disabled for security)

### Complaint Routes (`/api/complaints`)
- `GET /` - Retrieve complaints (role-based filtering)
- `GET /:id` - Get specific complaint
- `POST /` - Create new complaint (students only)
- `PATCH /:id/status` - Update complaint status (admin only)
- `DELETE /:id` - Delete complaint (pending status only)
- `GET /stats/summary` - Get complaint statistics

### User Management Routes (`/api/users`)
- `GET /` - List all students (admin only)
- `GET /credentials` - Get student credentials (admin only)
- `POST /add` - Add single student (admin only)
- `POST /bulk-upload` - Bulk import via CSV (admin only)
- `DELETE /:id` - Delete student (admin only)
- `POST /:id/reset-password` - Reset student password (admin only)

---

## 🔐 Security Features

### Authentication & Authorization
- **Session-based authentication** with MongoDB storage
- **Role-based access control** (student/admin roles)
- **Password hashing** using bcryptjs with salt rounds
- **Input validation** on all API endpoints
- **CORS configuration** for cross-origin requests

### Data Protection
- **No plaintext password storage**
- **Session timeout** after 24 hours
- **HTTPS-ready** configuration for production
- **Environment variable** protection for sensitive data

---

## 🎨 User Interface Features

### Student Dashboard
- **Complaint submission form** with category selection
- **Personal complaint history** with status tracking
- **Statistics overview** (total, pending, resolved)
- **Search and filter** capabilities
- **Delete pending complaints** functionality

### Admin Dashboard
- **All complaints overview** across all students
- **Status management** (Pending → In Progress → Resolved)
- **Comprehensive statistics** with category breakdown
- **Advanced filtering** by status and category
- **Real-time updates** without page refresh

### User Management Interface
- **Student registration** (single and bulk via CSV)
- **Password generation** and reset functionality
- **Student list management** with search capabilities
- **Credential distribution** for new accounts

---

## 🚀 Build and Deployment Commands

### Development Setup
```bash
# Install dependencies
npm install

# Start development server with auto-reload
npm run dev

# Start production server
npm start

# Seed database with demo data
node scripts/seedDatabase.js
```

### Environment Configuration
Create `.env` file with:
```
MONGODB_URI=mongodb://localhost:27017/grievance-portal
SESSION_SECRET=your-secret-key-here
NODE_ENV=development
PORT=3000
```

---

## 📁 File Structure Reference

```
PBLProject/
├── config/
│   └── database.js              # MongoDB connection configuration
├── models/
│   ├── User.js                  # User schema and methods
│   └── Complaint.js             # Complaint schema and methods
├── routes/
│   ├── auth.js                  # Authentication endpoints
│   ├── complaints.js            # Complaint CRUD endpoints
│   └── users.js                 # User management endpoints
├── public/
│   ├── api.js                   # Frontend API communication
│   └── script.js                # Frontend business logic
├── scripts/
│   └── seedDatabase.js          # Database initialization script
├── HTML Pages
│   ├── index.html               # Login interface
│   ├── student.html             # Student dashboard
│   ├── admin.html               # Admin dashboard
│   └── manage-users.html        # User management
├── server.js                    # Express server entry point
├── style.css                    # Global styles
└── package.json                 # Dependencies and scripts
```

---

## 🔍 Common Development Patterns

### API Response Format
All API endpoints return standardized responses:
```javascript
{
  success: boolean,
  message?: string,
  data?: any,
  error?: string
}
```

### Error Handling
- **Client-side**: Alert notifications for user feedback
- **Server-side**: Try-catch blocks with proper HTTP status codes
- **Validation**: Input validation before database operations

### Frontend Patterns
- **Modular functions** organized by feature area
- **Async/await** for API calls
- **DOM manipulation** for dynamic content updates
- **Event-driven** user interactions

---

## 🛠️ Maintenance and Troubleshooting

### Database Issues
- **Connection failures**: Check MongoDB service status
- **Authentication errors**: Verify MONGODB_URI in .env
- **Data corruption**: Use seed script to reset demo data

### Frontend Issues
- **API failures**: Check browser console for CORS errors
- **Session timeouts**: Implement automatic logout handling
- **UI rendering**: Verify DOM element IDs match JavaScript references

### Performance Optimization
- **Database indexing**: Ensure indexes on frequently queried fields
- **Frontend caching**: Implement local storage for user preferences
- **API optimization**: Use pagination for large complaint datasets

---

## 🔄 Integration Points

### External Services
- **MongoDB Atlas** - Cloud database hosting
- **Email services** - Future notification system
- **File storage** - Future attachment support

### Future Enhancements
- **Email notifications** for status updates
- **File attachments** for supporting documents
- **Mobile app** using React Native or Flutter
- **Analytics dashboard** with charts and graphs
- **Multi-language support** for diverse user base

---

## 📋 Testing and Quality Assurance

### Manual Testing Checklist
- [ ] User authentication (login/logout)
- [ ] Complaint creation and submission
- [ ] Status updates by administrators
- [ ] Search and filter functionality
- [ ] Statistics calculation accuracy
- [ ] Responsive design on mobile devices
- [ ] Session timeout handling
- [ ] Error message display

### Security Testing
- [ ] SQL injection prevention (MongoDB safe)
- [ ] Cross-site scripting (XSS) protection
- [ ] Session hijacking prevention
- [ ] Brute force attack mitigation
- [ ] Input validation robustness

---

## 📞 Support and Documentation

### Demo Credentials
- **Student**: `student@gmail.com` / Password: `123`
- **Admin**: `admin@gmail.com` / Password: `admin`

### Common Issues Resolution
1. **Server won't start**: Check if MongoDB is running
2. **Login fails**: Verify demo credentials or run seed script
3. **Complaints not loading**: Check browser console for API errors
4. **Styling issues**: Ensure style.css is properly loaded

### Code Style Guidelines
- **Indentation**: 2 spaces for JavaScript
- **Naming**: camelCase for functions and variables
- **Comments**: JSDoc style for functions
- **Error handling**: Always include try-catch blocks
- **Validation**: Validate all user inputs

---

*This documentation serves as a comprehensive guide for AI agents working on the College Grievance Redressal Portal project. It covers all technical aspects, from system architecture to deployment procedures, ensuring efficient development and maintenance of the application.*
