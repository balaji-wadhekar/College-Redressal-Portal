// Check auth
async function checkAuth() {
  try {
    const authData = await fetch('/api/auth/check').then(res => res.json());
    if (!authData.authenticated || authData.user.role !== 'admin') {
      window.location.href = "/";
      return false;
    }
    // Repopulate localStorage for frontend logic
    localStorage.setItem("role", authData.user.role);
    localStorage.setItem("email", authData.user.email);
    return true;
  } catch (e) {
    window.location.href = "/";
    return false;
  }
}

// Show alert
function showAlert(containerId, message, type = 'success') {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  const alert = document.createElement('div');
  alert.className = `alert ${type}`;
  alert.textContent = message;
  container.innerHTML = '';
  container.appendChild(alert);
  
  setTimeout(() => {
    alert.style.opacity = '0';
    setTimeout(() => container.innerHTML = '', 300);
  }, 5000);
}

// Format date
function formatDate(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric'
  });
}

// Add single student
async function addStudent(event) {
  event.preventDefault();
  
  const enrollment = document.getElementById('enrollment').value.trim().toUpperCase();
  const name = document.getElementById('studentName').value.trim();
  
  if (!enrollment || !name) {
    showAlert('addStudentAlert', 'Please fill all fields!', 'error');
    return;
  }
  
  try {
    const response = await fetch('/api/users/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ enrollment, name })
    });
    
    const result = await response.json();
    
    if (result.success) {
      showAlert('addStudentAlert', '✅ Student added successfully!', 'success');
      
      // Show credentials
      document.getElementById('newEnrollment').textContent = result.student.enrollment;
      document.getElementById('newPassword').textContent = result.student.password;
      document.getElementById('newStudentCredentials').style.display = 'block';
      
      // Reset form
      document.getElementById('addStudentForm').reset();
      
      // Reload students
      await loadStudents();
      
    } else {
      showAlert('addStudentAlert', result.error || 'Failed to add student', 'error');
    }
  } catch (error) {
    console.error('Add student error:', error);
    showAlert('addStudentAlert', 'Failed to add student', 'error');
  }
}

// Copy credentials to clipboard
function copyCredentials() {
  const enrollment = document.getElementById('newEnrollment').textContent;
  const password = document.getElementById('newPassword').textContent;
  
  const text = `Enrollment/Username: ${enrollment}\nPassword: ${password}`;
  
  navigator.clipboard.writeText(text).then(() => {
    alert('Credentials copied to clipboard!');
  }).catch(() => {
    alert('Failed to copy. Please copy manually.');
  });
}

// Download sample CSV
function downloadSampleCSV() {
  const csvContent = "enrollment,name\nADT25SOCBD001,John Doe\nADT25SOCBD002,Jane Smith\nADT25SOCBD003,Bob Johnson";
  
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'students_template.csv';
  a.click();
  window.URL.revokeObjectURL(url);
}

// Bulk upload students
async function bulkUpload(event) {
  event.preventDefault();
  
  const fileInput = document.getElementById('csvFile');
  const file = fileInput.files[0];
  
  if (!file) {
    showAlert('bulkUploadAlert', 'Please select a CSV file!', 'error');
    return;
  }
  
  const formData = new FormData();
  formData.append('csvFile', file);
  
  try {
    showAlert('bulkUploadAlert', '⏳ Uploading and processing...', 'success');
    
    const response = await fetch('/api/users/bulk-upload', {
      method: 'POST',
      credentials: 'include',
      body: formData
    });
    
    const result = await response.json();
    
    if (result.success) {
      // Show results
      let resultsHTML = `
        <div style="padding: 1rem; background: #d4edda; border-left: 4px solid #28a745; border-radius: 4px;">
          <h4 style="color: #155724; margin-bottom: 1rem;">✅ Upload Complete!</h4>
          <p style="color: #155724;"><strong>Total Processed:</strong> ${result.totalProcessed}</p>
          <p style="color: #155724;"><strong>Successfully Added:</strong> ${result.successCount}</p>
          ${result.errorCount > 0 ? `<p style="color: #721c24;"><strong>Errors:</strong> ${result.errorCount}</p>` : ''}
        </div>
      `;
      
      if (result.addedStudents && result.addedStudents.length > 0) {
        resultsHTML += `
          <div style="margin-top: 1rem; padding: 1rem; background: #fff; border: 1px solid #28a745; border-radius: 4px;">
            <h4 style="margin-bottom: 0.5rem;">📋 Generated Credentials:</h4>
            <p style="font-size: 0.85rem; color: #666; margin-bottom: 1rem;">
              <em>⚠️ Save these credentials! They cannot be retrieved later.</em>
            </p>
            <div style="max-height: 300px; overflow-y: auto;">
              <table style="width: 100%; font-size: 0.85rem;">
                <thead>
                  <tr style="background: #f8f9fa;">
                    <th style="padding: 0.5rem; text-align: left;">Enrollment</th>
                    <th style="padding: 0.5rem; text-align: left;">Name</th>
                    <th style="padding: 0.5rem; text-align: left;">Password</th>
                  </tr>
                </thead>
                <tbody>
                  ${result.addedStudents.map(student => `
                    <tr>
                      <td style="padding: 0.5rem;">${student.enrollment}</td>
                      <td style="padding: 0.5rem;">${student.name}</td>
                      <td style="padding: 0.5rem; font-family: monospace; background: #f8f9fa;">${student.password}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
            <button onclick="exportCredentials()" class="secondary" style="margin-top: 1rem;">📥 Download Credentials</button>
          </div>
        `;
        
        // Store credentials for export
        window.uploadedCredentials = result.addedStudents;
      }
      
      if (result.errors && result.errors.length > 0) {
        resultsHTML += `
          <div style="margin-top: 1rem; padding: 1rem; background: #f8d7da; border-left: 4px solid #dc3545; border-radius: 4px;">
            <h4 style="color: #721c24; margin-bottom: 0.5rem;">❌ Errors:</h4>
            <ul style="margin: 0; padding-left: 1.5rem; color: #721c24;">
              ${result.errors.map(err => `<li>Row ${err.row}: ${err.error}</li>`).join('')}
            </ul>
          </div>
        `;
      }
      
      document.getElementById('uploadResults').innerHTML = resultsHTML;
      document.getElementById('uploadResults').style.display = 'block';
      
      showAlert('bulkUploadAlert', result.message, 'success');
      
      // Reset form
      document.getElementById('bulkUploadForm').reset();
      
      // Reload students
      await loadStudents();
      
    } else {
      showAlert('bulkUploadAlert', result.error || 'Upload failed', 'error');
    }
  } catch (error) {
    console.error('Bulk upload error:', error);
    showAlert('bulkUploadAlert', 'Upload failed', 'error');
  }
}

// Export credentials to CSV
function exportCredentials() {
  if (!window.uploadedCredentials || window.uploadedCredentials.length === 0) {
    alert('No credentials to export');
    return;
  }
  
  let csv = 'Enrollment,Name,Username,Password\n';
  window.uploadedCredentials.forEach(student => {
    csv += `${student.enrollment},${student.name},${student.username},${student.password}\n`;
  });
  
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'student_credentials_' + new Date().getTime() + '.csv';
  a.click();
  window.URL.revokeObjectURL(url);
}

// Load all students
async function loadStudents() {
  try {
    const response = await fetch('/api/users', {
      credentials: 'include'
    });
    
    const result = await response.json();
    
    if (!result.success) {
      console.error('Failed to load students');
      return;
    }
    
    const students = result.students;
    const table = document.getElementById('studentsTable').getElementsByTagName('tbody')[0];
    table.innerHTML = '';
    
    // Update stats
    document.getElementById('totalStudents').textContent = students.length;
    
    if (students.length === 0) {
      document.getElementById('emptyStudentsState').style.display = 'block';
      document.querySelector('.table-container').style.display = 'none';
      return;
    }
    
    document.getElementById('emptyStudentsState').style.display = 'none';
    document.querySelector('.table-container').style.display = 'block';
    
    students.forEach(student => {
      const row = `<tr>
        <td><strong>${student.enrollment}</strong></td>
        <td>${student.email}</td>
        <td>${student.enrollment}</td>
        <td>${formatDate(student.createdAt)}</td>
        <td>
          <button class="secondary" onclick="resetPassword('${student._id}', '${student.enrollment}')">Reset Password</button>
          <button class="danger" onclick="deleteStudent('${student._id}', '${student.enrollment}')">Delete</button>
        </td>
      </tr>`;
      table.innerHTML += row;
    });
    
  } catch (error) {
    console.error('Load students error:', error);
  }
}

// Filter students
function filterStudents() {
  const searchTerm = document.getElementById('searchStudents').value.toLowerCase();
  const rows = document.querySelectorAll('#studentsTable tbody tr');
  
  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    if (text.includes(searchTerm)) {
      row.style.display = '';
    } else {
      row.style.display = 'none';
    }
  });
}

// Reset password
async function resetPassword(userId, enrollment) {
  if (!confirm(`Reset password for student ${enrollment}?`)) return;
  
  try {
    const response = await fetch(`/api/users/${userId}/reset-password`, {
      method: 'POST',
      credentials: 'include'
    });
    
    const result = await response.json();
    
    if (result.success) {
      const password = result.student.password;
      
      const msg = `Password reset successful!\n\nEnrollment: ${enrollment}\nNew Password: ${password}\n\n⚠️ Please save this password and share with the student.`;
      alert(msg);
      
      // Copy to clipboard
      if (navigator.clipboard) {
        navigator.clipboard.writeText(`Enrollment: ${enrollment}\nPassword: ${password}`);
      }
    } else {
      alert(result.error || 'Failed to reset password');
    }
  } catch (error) {
    console.error('Reset password error:', error);
    alert('Failed to reset password');
  }
}

// Delete student
async function deleteStudent(userId, enrollment) {
  if (!confirm(`Are you sure you want to delete student ${enrollment}?\n\nThis will also delete all their complaints.`)) return;
  
  try {
    const response = await fetch(`/api/users/${userId}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    
    const result = await response.json();
    
    if (result.success) {
      alert('Student deleted successfully');
      await loadStudents();
    } else {
      alert(result.error || 'Failed to delete student');
    }
  } catch (error) {
    console.error('Delete student error:', error);
    alert('Failed to delete student');
  }
}

// Logout
async function logout() {
  if (!confirm("Are you sure you want to logout?")) return;
  
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    });
    localStorage.clear();
    window.location.href = "/";
  } catch (error) {
    localStorage.clear();
    window.location.href = "/";
  }
}

// Initialize
window.onload = async function() {
  if (await checkAuth()) {
    await loadStudents();
  }
};
