// ========== UTILITY FUNCTIONS ==========
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
  }, 3000);
}

function formatDate(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// ========== LOGIN ==========
async function handleAdminLogin(event) {
  event.preventDefault();

  const formData = new FormData(event.target);
  const payload = Object.fromEntries(formData.entries());

  // 1. Frontend Validation
  if (!payload.email || !payload.password) {
    showAlert('alertContainer', 'Please fill in all fields!', 'error');
    return;
  }

  // 2. Submit to Backend
  try {
    const result = await api.login(payload);

    if (result.error) {
      showAlert('alertContainer', result.error, 'error');
      return;
    }

    // Login Success - Task 2: Save token FIRST, navigate SECOND
    if (result.token) {
      localStorage.setItem("token", result.token);
    }
    localStorage.setItem("role", result.user?.role || "admin");
    localStorage.setItem("email", result.user?.email || "");
    localStorage.setItem("enrollment", result.user?.enrollment || "");

    // Redirect using the URL from backend
    window.location.href = result.redirectUrl || (result.user?.role === 'admin' ? "admin.html" : "student.html");

  } catch (error) {
    console.error(error);
    showAlert('alertContainer', 'Login failed. Please check your connection.', 'error');
  }
}

async function handleStudentLogin(event) {
  event.preventDefault();
  const enrollmentNumber = event.target.enrollmentNumber.value;
  const email = event.target.email.value;

  try {
    const result = await api.requestOtp(enrollmentNumber, email);
    if (result.success) {
      // Update UI to show OTP field without reloading (Stateless JWT Flow)
      const form = document.getElementById('studentLoginForm');
      if (form) {
        form.innerHTML = `
          <input type="hidden" name="enrollmentNumber" value="${result.enrollmentNumber}">
          <input type="hidden" name="email" value="${result.email}">
          <div>
              <p class="text-sm font-bold text-[#003366] text-center mb-2">Enter 4-Digit Code</p>
              <input type="text" name="otp" required pattern="\\d{4}" maxlength="4" autocomplete="off"
                     class="w-full border border-gray-300 p-4 rounded bg-blue-50 focus:outline-none focus:ring-2 focus:ring-[#003366] text-center text-3xl tracking-[1em] font-mono" 
                     placeholder="••••">
          </div>
          <button type="submit" id="btn-verify" class="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded shadow-md mt-2">
              VERIFY & ENTER PORTAL
          </button>
        `;
      }
      showAlert('alertContainer', result.message, 'success');
    } else {
      showAlert('alertContainer', result.error || "Failed to send code", 'error');
    }
  } catch (e) {
    console.error(e);
    showAlert('alertContainer', "Connection error. Please try again.", 'error');
  }
}

async function handleVerifyOtp(event) {
  event.preventDefault();
  const formData = new FormData(event.target);
  const payload = Object.fromEntries(formData.entries());

  try {
    const result = await api.verifyOtp(payload);
    if (result.success && result.token) {
      // Task 2: Save token FIRST
      localStorage.setItem("token", result.token);
      localStorage.setItem("role", result.user.role);
      localStorage.setItem("email", result.user.email);
      localStorage.setItem("enrollment", result.user.enrollment);
      
      // Navigate SECOND
      window.location.href = result.redirectUrl || (result.user.role === 'admin' ? "admin.html" : "student.html");
    } else {
      showAlert('alertContainer', result.error || "Verification failed", 'error');
    }
  } catch (e) {
    console.error(e);
    showAlert('alertContainer', "Connection error during verification", 'error');
  }
}


// ========== LOGOUT ==========
function logout() {
  if (confirm("Are you sure you want to logout?")) {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("email");
    localStorage.removeItem("enrollment");
    localStorage.removeItem("name");
    window.location.href = "/";
  }
}

// ========== CHECK AUTH ==========
async function checkAuth(requiredRole) {
  // Task 3: Immediately check for the token
  const token = localStorage.getItem('token');
  if (!token) {
    console.log('No token found, redirecting to login...');
    window.location.href = "/"; // Kick out to login if no token
    return false;
  }

  try {
    const authData = await api.checkAuth();
    if (!authData.authenticated || authData.user.role !== requiredRole) {
      window.location.href = "/";
      return false;
    }
    
    // Synchronize UI and localStorage
    updateUserUI(authData.user);
    
    return true;
  } catch(e) {
    console.error('Auth check error:', e);
    window.location.href = "/";
    return false;
  }
}

function updateUserUI(user) {
  // Sync localStorage
  localStorage.setItem("role", user.role || "");
  localStorage.setItem("email", user.email || "");
  localStorage.setItem("enrollment", user.enrollment || "");
  if (user.name) localStorage.setItem("name", user.name);

  // Auto-populate fields on Student Dashboard (as requested: Enrollment and Email only)
  const enrollmentField = document.getElementById("studentEnrollment");
  const emailField = document.getElementById("studentEmail");

  if (enrollmentField) {
    enrollmentField.value = user.enrollment || "";
  }
  if (emailField) {
    emailField.value = user.email || "";
  }
}

// ========== STUDENT FUNCTIONS ==========
async function submitComplaint(event) {
  event.preventDefault();

  const title = document.getElementById("title").value.trim();
  const category = document.getElementById("category").value;
  const description = document.getElementById("description").value.trim();
  const docFile = document.getElementById("docFile").files[0];
  const solutionText = document.getElementById("solutionText").value.trim();
  const department = document.getElementById("studentDept").value;
  const phone = document.getElementById("studentPhone").value;

  if (!title || !category || !description) {
    showAlert('complaintAlert', 'Please fill all mandatory fields!', 'error');
    return;
  }

  const formData = new FormData();
  formData.append('title', title);
  formData.append('category', category);
  formData.append('description', description);
  formData.append('department', department);
  formData.append('phone', phone);
  formData.append('expectedSolution', solutionText);
  if (docFile) {
    formData.append('document', docFile);
  }

  try {
    showAlert('complaintAlert', '⏳ Submitting grievance...', 'success');
    const result = await api.createComplaint(formData);

    if (result.success) {
      showAlert('complaintAlert', '✅ Grievance submitted successfully!', 'success');
      document.getElementById("complaintForm").reset();
      loadComplaints();
      updateStudentStats();
    } else {
      showAlert('complaintAlert', result.error || 'Failed to submit grievance', 'error');
    }
  } catch (error) {
    console.error('Submit error:', error);
    showAlert('complaintAlert', 'Failed to submit. Please try again.', 'error');
  }
}

async function loadComplaints() {
  const table = document.getElementById("complaintTable")?.getElementsByTagName("tbody")[0];
  if (!table) return;

  try {
    const result = await api.getComplaints();
    if (!result.success) return;

    const complaints = result.data;
    table.innerHTML = "";

    if (complaints.length === 0) {
      document.getElementById("emptyState").style.display = "block";
      document.querySelector(".table-container").style.display = "none";
      return;
    }

    document.getElementById("emptyState").style.display = "none";
    document.querySelector(".table-container").style.display = "block";

    complaints.forEach((c) => {
      const statusClass = c.status.toLowerCase().replace(' ', '-');
      const row = `<tr>
                  <td><strong>#${(c._id || '').substr(-6)}</strong></td>
                  <td>${c.title}</td>
                  <td>${new Date(c.incidentDate || c.createdAt).toLocaleDateString()}</td>
                  <td>${c.category}</td>
                  <td style="max-width: 250px;">${c.description}</td>
                  <td><span class="status ${statusClass}">${c.status}</span></td>
                  <td>${formatDate(c.createdAt)}</td>
                  <td>
                    <button class="secondary" onclick="viewComplaint('${c._id}')">View</button>
                    ${c.status === 'Pending' ? `<button class="danger" onclick="deleteComplaint('${c._id}')">Delete</button>` : ''}
                  </td>
                </tr>`;
      table.innerHTML += row;
    });

    filterComplaints();
  } catch (error) {
    console.error('Load complaints error:', error);
  }
}

async function deleteComplaint(id) {
  if (!confirm("Are you sure you want to delete this grievance?")) return;

  try {
    const result = await api.deleteComplaint(id);
    if (result.success) {
      showAlert('complaintAlert', '✅ Grievance deleted successfully!', 'success');
      if (window.location.pathname.includes('admin.html')) {
        loadAdminComplaints();
      } else {
        loadComplaints();
        updateStudentStats();
      }
    } else {
      alert(result.error || 'Failed to delete grievance');
    }
  } catch (error) {
    console.error('Delete error:', error);
    alert('Failed to delete grievance');
  }
}

async function updateStudentStats() {
  try {
    const result = await api.getComplaints();
    if (!result.success) return;

    const complaints = result.data;
    const total = complaints.length;
    const pending = complaints.filter(c => c.status === "Pending" || c.status === "In Progress").length;
    const resolved = complaints.filter(c => c.status === "Resolved").length;

    if (document.getElementById("totalComplaints")) {
      document.getElementById("totalComplaints").textContent = total;
    }
    if (document.getElementById("pendingComplaints")) {
      document.getElementById("pendingComplaints").textContent = pending;
    }
    if (document.getElementById("resolvedComplaints")) {
      document.getElementById("resolvedComplaints").textContent = resolved;
    }
  } catch (error) {
    console.error('Stats error:', error);
  }
}

function filterComplaints() {
  let searchTerm = document.getElementById("searchInput")?.value.toLowerCase() || '';
  let statusFilter = document.getElementById("statusFilter")?.value || '';
  let categoryFilter = document.getElementById("categoryFilter")?.value || '';

  let rows = document.querySelectorAll("#complaintTable tbody tr");

  rows.forEach(row => {
    let text = row.textContent.toLowerCase();
    let status = row.querySelector('.status')?.textContent || '';
    let category = row.cells[2]?.textContent || '';

    let matchesSearch = text.includes(searchTerm);
    let matchesStatus = !statusFilter || status === statusFilter;
    let matchesCategory = !categoryFilter || category === categoryFilter;

    if (matchesSearch && matchesStatus && matchesCategory) {
      row.style.display = '';
    } else {
      row.style.display = 'none';
    }
  });
}

// ========== ADMIN FUNCTIONS ==========
async function loadAdminComplaints() {
  const table = document.getElementById("adminTable")?.getElementsByTagName("tbody")[0];
  if (!table) return;

  try {
    const result = await api.getComplaints();
    if (!result.success) return;

    const complaints = result.data;
    table.innerHTML = "";

    if (complaints.length === 0) {
      document.getElementById("adminEmptyState").style.display = "block";
      document.querySelector(".table-container").style.display = "none";
      return;
    }

    document.getElementById("adminEmptyState").style.display = "none";
    document.querySelector(".table-container").style.display = "block";

    complaints.forEach((c) => {
      const statusClass = c.status.toLowerCase().replace(' ', '-');
      const row = `<tr>
                  <td><strong>#${(c._id || '').substr(-6)}</strong></td>
                  <td>${c.title}</td>
                  <td>${c.category}</td>
                  <td style="max-width: 250px;">${c.description}</td>
                  <td><span class="status ${statusClass}">${c.status}</span></td>
                  <td>${formatDate(c.createdAt)}</td>
                  <td>
                    <button class="secondary" onclick="viewComplaint('${c._id}')">View</button>
                    ${c.status !== 'Resolved' ?
                      `<button class="success" onclick="updateStatus('${c._id}', 'Resolved')">Resolve</button>` : ''}
                    <button class="danger" onclick="deleteComplaint('${c._id}')">Delete</button>
                  </td>
                </tr>`;
      table.innerHTML += row;
    });

    updateAdminStats();
    updateCategoryStats();
    filterAdminComplaints();
  } catch (error) {
    console.error('Load admin complaints error:', error);
  }
}

async function updateStatus(id, newStatus) {
  try {
    const result = await api.updateComplaintStatus(id, newStatus);
    if (result.success) {
      showAlert('adminAlert', `✅ Complaint marked as ${newStatus}!`, 'success');
      loadAdminComplaints();
    } else {
      showAlert('adminAlert', result.error || 'Failed to update status', 'error');
    }
  } catch (error) {
    console.error('Update status error:', error);
    showAlert('adminAlert', 'Failed to update status', 'error');
  }
}

async function updateAdminStats() {
  try {
    const result = await api.getComplaints();
    if (!result.success) return;

    const complaints = result.data;
    const total = complaints.length;
    const pending = complaints.filter(c => c.status === "Pending").length;
    const inProgress = complaints.filter(c => c.status === "In Progress").length;
    const resolved = complaints.filter(c => c.status === "Resolved").length;

    if (document.getElementById("adminTotalComplaints")) {
      document.getElementById("adminTotalComplaints").textContent = total;
    }
    if (document.getElementById("adminPendingComplaints")) {
      document.getElementById("adminPendingComplaints").textContent = pending;
    }
    if (document.getElementById("adminInProgressComplaints")) {
      document.getElementById("adminInProgressComplaints").textContent = inProgress;
    }
    if (document.getElementById("adminResolvedComplaints")) {
      document.getElementById("adminResolvedComplaints").textContent = resolved;
    }
  } catch (error) {
    console.error('Admin stats error:', error);
  }
}

async function updateCategoryStats() {
  try {
    const result = await api.getComplaints();
    if (!result.success) return;

    const complaints = result.data;
    const categoryContainer = document.getElementById("categoryStats");
    if (!categoryContainer) return;

    // Count by category
    const categoryCounts = {};
    complaints.forEach(c => {
      categoryCounts[c.category] = (categoryCounts[c.category] || 0) + 1;
    });

    categoryContainer.innerHTML = '';
    const colors = ['blue', 'green', 'orange', ''];
    let colorIndex = 0;

    for (const category in categoryCounts) {
      const card = document.createElement('div');
      card.className = `stat-card ${colors[colorIndex % colors.length]}`;
      card.innerHTML = `
        <h4>${category}</h4>
        <div class="number">${categoryCounts[category]}</div>
      `;
      categoryContainer.appendChild(card);
      colorIndex++;
    }
  } catch (error) {
    console.error('Category stats error:', error);
  }
}

function filterAdminComplaints() {
  let searchTerm = document.getElementById("adminSearchInput")?.value.toLowerCase() || '';
  let statusFilter = document.getElementById("adminStatusFilter")?.value || '';
  let categoryFilter = document.getElementById("adminCategoryFilter")?.value || '';

  let rows = document.querySelectorAll("#adminTable tbody tr");

  rows.forEach(row => {
    let text = row.textContent.toLowerCase();
    let status = row.querySelector('.status')?.textContent || '';
    let category = row.cells[2]?.textContent || '';

    let matchesSearch = text.includes(searchTerm);
    let matchesStatus = !statusFilter || status === statusFilter;
    let matchesCategory = !categoryFilter || category === categoryFilter;

    if (matchesSearch && matchesStatus && matchesCategory) {
      row.style.display = '';
    } else {
      row.style.display = 'none';
    }
  });
}

// ========== PAGE Load INITIALIZATION ==========
window.onload = async function () {
  // Check which page we're on and initialize accordingly
  if (window.location.pathname.includes('student.html')) {
    if (await checkAuth('student')) {
      loadComplaints();
      updateStudentStats();
    }
  } else if (window.location.pathname.includes('admin.html')) {
    if (await checkAuth('admin')) {
      loadAdminComplaints();
    }
  }
};
