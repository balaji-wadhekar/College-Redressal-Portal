# AGENTS.md

## Project Overview
College Grievance Redressal Portal - A vanilla HTML/CSS/JavaScript web application for managing student complaints.

## Build/Run Commands
- **Run**: Open `index.html` in a browser
- **No build step required** - static HTML/CSS/JS application
- **Test**: Manual testing via browser (no automated tests configured)

## Architecture
- **Pages**: `index.html` (login), `student.html` (student dashboard), `admin.html` (admin dashboard)
- **Data Storage**: localStorage (complaints stored as JSON array)
- **Auth**: Simple role-based login (student/admin) stored in localStorage
- **Demo Accounts**: Student: student@gmail.com/123, Admin: admin@gmail.com/admin

## Code Style Guidelines
- **Formatting**: Use 2-space indentation
- **JavaScript**: Vanilla JS, no frameworks
- **Functions**: Top-level functions organized by role (login, student, admin sections)
- **Naming**: camelCase for functions and variables (e.g., `loadComplaints`, `submitComplaint`)
- **HTML**: Semantic HTML5, inputs with clear IDs matching JS references
- **CSS**: Class-based styling with `.container`, `.login-box`, etc.
- **Data Structure**: Complaints have `{id, title, category, description, status}` fields
- **Error Handling**: Use `alert()` for user feedback; validate empty fields before submission
