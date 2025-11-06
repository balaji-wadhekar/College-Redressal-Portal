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
function login(event) {
  event.preventDefault();
  
  let email = document.getElementById("email").value.trim();
  let pass = document.getElementById("password").value;
  let enroll = document.getElementById("enroll").value.trim();

  if (!email || !pass) {
    showAlert('alertContainer', 'Please fill in all required fields!', 'error');
    return;
  }

  if (email === "student@gmail.com" && pass === "123") {
    localStorage.setItem("role", "student");
    localStorage.setItem("email", email);
    localStorage.setItem("enrollment", enroll || "N/A");
    window.location.href = "student.html";
  } else if (email === "admin@gmail.com" && pass === "admin") {
    localStorage.setItem("role", "admin");
    localStorage.setItem("email", email);
    window.location.href = "admin.html";
  } else {
    showAlert('alertContainer', 'Invalid credentials! Please try again.', 'error');
  }
}

// ========== LOGOUT ==========
function logout() {
  if (confirm("Are you sure you want to logout?")) {
    localStorage.removeItem("role");
    localStorage.removeItem("email");
    localStorage.removeItem("enrollment");
    window.location.href = "index.html";
  }
}

// ========== CHECK AUTH ==========
function checkAuth(requiredRole) {
  const role = localStorage.getItem("role");
  if (!role || role !== requiredRole) {
    window.location.href = "index.html";
  }
}

// ========== STUDENT FUNCTIONS ==========
function submitComplaint(event) {
  event.preventDefault();
  
  let title = document.getElementById("title").value.trim();
  let category = document.getElementById("category").value;
  let desc = document.getElementById("description").value.trim();

  if (!title || !category || !desc) {
    showAlert('complaintAlert', 'Please fill all fields!', 'error');
    return;
  }

  let complaints = JSON.parse(localStorage.getItem("complaints")) || [];
  let newComplaint = {
    id: generateId(),
    title: title,
    category: category,
    description: desc,
    status: "Pending",
    date: new Date().toISOString(),
    studentEmail: localStorage.getItem("email")
  };

  complaints.push(newComplaint);
  localStorage.setItem("complaints", JSON.stringify(complaints));

  showAlert('complaintAlert', '✅ Complaint submitted successfully!', 'success');
  
  document.getElementById("complaintForm").reset();
  loadComplaints();
  updateStudentStats();
}

function loadComplaints() {
  let table = document.getElementById("complaintTable")?.getElementsByTagName("tbody")[0];
  if (!table) return;
  
  let complaints = JSON.parse(localStorage.getItem("complaints")) || [];
  let studentEmail = localStorage.getItem("email");
  
  // Filter complaints for current student
  let myComplaints = complaints.filter(c => c.studentEmail === studentEmail);
  
  table.innerHTML = "";
  
  if (myComplaints.length === 0) {
    document.getElementById("emptyState").style.display = "block";
    document.querySelector(".table-container").style.display = "none";
    return;
  }
  
  document.getElementById("emptyState").style.display = "none";
  document.querySelector(".table-container").style.display = "block";
  
  // Sort by date (newest first)
  myComplaints.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  myComplaints.forEach((c, index) => {
    let statusClass = c.status.toLowerCase().replace(' ', '-');
    let row = `<tr>
                <td><strong>#${c.id.substr(0, 6)}</strong></td>
                <td>${c.title}</td>
                <td>${c.category}</td>
                <td style="max-width: 300px;">${c.description}</td>
                <td><span class="status ${statusClass}">${c.status}</span></td>
                <td>${formatDate(c.date)}</td>
                <td>
                  ${c.status === 'Pending' ? `<button class="danger" onclick="deleteComplaint('${c.id}')">Delete</button>` : '<span style="color: #999;">-</span>'}
                </td>
              </tr>`;
    table.innerHTML += row;
  });
  
  // Apply filters if any
  filterComplaints();
}

function deleteComplaint(id) {
  if (!confirm("Are you sure you want to delete this complaint?")) return;
  
  let complaints = JSON.parse(localStorage.getItem("complaints")) || [];
  complaints = complaints.filter(c => c.id !== id);
  localStorage.setItem("complaints", JSON.stringify(complaints));
  
  showAlert('complaintAlert', 'Complaint deleted successfully!', 'success');
  loadComplaints();
  updateStudentStats();
}

function updateStudentStats() {
  let complaints = JSON.parse(localStorage.getItem("complaints")) || [];
  let studentEmail = localStorage.getItem("email");
  let myComplaints = complaints.filter(c => c.studentEmail === studentEmail);
  
  let total = myComplaints.length;
  let pending = myComplaints.filter(c => c.status === "Pending" || c.status === "In Progress").length;
  let resolved = myComplaints.filter(c => c.status === "Resolved").length;
  
  if (document.getElementById("totalComplaints")) {
    document.getElementById("totalComplaints").textContent = total;
  }
  if (document.getElementById("pendingComplaints")) {
    document.getElementById("pendingComplaints").textContent = pending;
  }
  if (document.getElementById("resolvedComplaints")) {
    document.getElementById("resolvedComplaints").textContent = resolved;
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
function loadAdminComplaints() {
  let table = document.getElementById("adminTable")?.getElementsByTagName("tbody")[0];
  if (!table) return;
  
  let complaints = JSON.parse(localStorage.getItem("complaints")) || [];
  
  table.innerHTML = "";
  
  if (complaints.length === 0) {
    document.getElementById("adminEmptyState").style.display = "block";
    document.querySelector(".table-container").style.display = "none";
    return;
  }
  
  document.getElementById("adminEmptyState").style.display = "none";
  document.querySelector(".table-container").style.display = "block";
  
  // Sort by date (newest first)
  complaints.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  complaints.forEach((c, i) => {
    let statusClass = c.status.toLowerCase().replace(' ', '-');
    let row = `<tr>
                <td><strong>#${c.id.substr(0, 6)}</strong></td>
                <td>${c.title}</td>
                <td>${c.category}</td>
                <td style="max-width: 300px;">${c.description}</td>
                <td><span class="status ${statusClass}">${c.status}</span></td>
                <td>${formatDate(c.date)}</td>
                <td>
                  ${c.status !== 'Resolved' ? 
                    `<button class="secondary" onclick="updateStatus(${i}, 'In Progress')">In Progress</button>
                     <button class="success" onclick="updateStatus(${i}, 'Resolved')">Resolve</button>` 
                    : '<span style="color: #28a745; font-weight: 600;">✓ Completed</span>'}
                </td>
              </tr>`;
    table.innerHTML += row;
  });
  
  updateAdminStats();
  updateCategoryStats();
  filterAdminComplaints();
}

function updateStatus(index, newStatus) {
  let complaints = JSON.parse(localStorage.getItem("complaints")) || [];
  complaints[index].status = newStatus;
  localStorage.setItem("complaints", JSON.stringify(complaints));
  
  showAlert('adminAlert', `✅ Complaint marked as ${newStatus}!`, 'success');
  loadAdminComplaints();
}

function updateAdminStats() {
  let complaints = JSON.parse(localStorage.getItem("complaints")) || [];
  
  let total = complaints.length;
  let pending = complaints.filter(c => c.status === "Pending").length;
  let inProgress = complaints.filter(c => c.status === "In Progress").length;
  let resolved = complaints.filter(c => c.status === "Resolved").length;
  
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
}

function updateCategoryStats() {
  let complaints = JSON.parse(localStorage.getItem("complaints")) || [];
  let categoryContainer = document.getElementById("categoryStats");
  
  if (!categoryContainer) return;
  
  // Count by category
  let categoryCounts = {};
  complaints.forEach(c => {
    categoryCounts[c.category] = (categoryCounts[c.category] || 0) + 1;
  });
  
  categoryContainer.innerHTML = '';
  
  const colors = ['blue', 'green', 'orange', ''];
  let colorIndex = 0;
  
  for (let category in categoryCounts) {
    let card = document.createElement('div');
    card.className = `stat-card ${colors[colorIndex % colors.length]}`;
    card.innerHTML = `
      <h4>${category}</h4>
      <div class="number">${categoryCounts[category]}</div>
    `;
    categoryContainer.appendChild(card);
    colorIndex++;
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

// ========== PAGE LOAD INITIALIZATION ==========
window.onload = function() {
  // Check which page we're on and initialize accordingly
  if (window.location.pathname.includes('student.html')) {
    checkAuth('student');
    loadComplaints();
    updateStudentStats();
  } else if (window.location.pathname.includes('admin.html')) {
    checkAuth('admin');
    loadAdminComplaints();
  }
};
