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

// ========== LOGIN ==========
async function login(event) {
  event.preventDefault();
  
  let email = document.getElementById("email").value.trim();
  let pass = document.getElementById("password").value;

  if (!email || !pass) {
    showAlert('alertContainer', 'Please fill in all required fields!', 'error');
    return;
  }

  try {
    const result = await api.login(email, pass);

    if (result.success) {
      localStorage.setItem("role", result.user.role);
      localStorage.setItem("email", result.user.email);
      localStorage.setItem("enrollment", result.user.enrollment || "N/A");
      
      if (result.user.role === 'student') {
        window.location.href = "student.html";
      } else {
        window.location.href = "admin.html";
      }
    } else {
      showAlert('alertContainer', result.error || 'Invalid credentials!', 'error');
    }
  } catch (error) {
    console.error('Login error:', error);
    showAlert('alertContainer', 'Login failed. Please try again.', 'error');
  }
}

// ========== LOGOUT ==========
async function logout() {
  if (!confirm("Are you sure you want to logout?")) return;
  
  try {
    await api.logout();
    localStorage.clear();
    window.location.href = "index.html";
  } catch (error) {
    console.error('Logout error:', error);
    localStorage.clear();
    window.location.href = "index.html";
  }
}

// ========== CHECK AUTH ==========
async function checkAuth(requiredRole) {
  const role = localStorage.getItem("role");
  if (!role || role !== requiredRole) {
    window.location.href = "index.html";
    return false;
  }
  return true;
}

// ========== STUDENT FUNCTIONS ==========
async function submitComplaint(event) {
  event.preventDefault();
  
  let title = document.getElementById("title").value.trim();
  let category = document.getElementById("category").value;
  let desc = document.getElementById("description").value.trim();

  if (!title || !category || !desc) {
    showAlert('complaintAlert', 'Please fill all fields!', 'error');
    return;
  }

  try {
    const result = await api.createComplaint(title, category, desc);

    if (result.success) {
      showAlert('complaintAlert', '✅ Complaint submitted successfully!', 'success');
      document.getElementById("complaintForm").reset();
      await loadComplaints();
      await updateStudentStats();
    } else {
      showAlert('complaintAlert', result.error || 'Failed to submit complaint', 'error');
    }
  } catch (error) {
    console.error('Submit complaint error:', error);
    showAlert('complaintAlert', 'Failed to submit complaint. Please try again.', 'error');
  }
}

async function loadComplaints() {
  try {
    const result = await api.getComplaints();
    
    if (!result.success) {
      console.error('Failed to load complaints');
      return;
    }

    let table = document.getElementById("complaintTable")?.getElementsByTagName("tbody")[0];
    if (!table) return;
    
    const complaints = result.complaints;
    table.innerHTML = "";
    
    if (complaints.length === 0) {
      document.getElementById("emptyState").style.display = "block";
      document.querySelector(".table-container").style.display = "none";
      return;
    }
    
    document.getElementById("emptyState").style.display = "none";
    document.querySelector(".table-container").style.display = "block";
    
    complaints.forEach((c) => {
      let statusClass = c.status.toLowerCase().replace(' ', '-');
      let row = `<tr>
                  <td><strong>#${c._id.substr(-6)}</strong></td>
                  <td>${c.title}</td>
                  <td>${c.category}</td>
                  <td style="max-width: 300px;">${c.description}</td>
                  <td><span class="status ${statusClass}">${c.status}</span></td>
                  <td>${formatDate(c.createdAt)}</td>
                  <td>
                    ${c.status === 'Pending' ? `<button class="danger" onclick="deleteComplaint('${c._id}')">Delete</button>` : '<span style="color: #999;">-</span>'}
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
  if (!confirm("Are you sure you want to delete this complaint?")) return;
  
  try {
    const result = await api.deleteComplaint(id);

    if (result.success) {
      showAlert('complaintAlert', 'Complaint deleted successfully!', 'success');
      await loadComplaints();
      await updateStudentStats();
    } else {
      showAlert('complaintAlert', result.error || 'Failed to delete complaint', 'error');
    }
  } catch (error) {
    console.error('Delete complaint error:', error);
    showAlert('complaintAlert', 'Failed to delete complaint', 'error');
  }
}

async function updateStudentStats() {
  try {
    const result = await api.getStats();
    
    if (result.success) {
      const stats = result.stats;
      
      if (document.getElementById("totalComplaints")) {
        document.getElementById("totalComplaints").textContent = stats.total || 0;
      }
      if (document.getElementById("pendingComplaints")) {
        document.getElementById("pendingComplaints").textContent = 
          (stats.pending || 0) + (stats.inProgress || 0);
      }
      if (document.getElementById("resolvedComplaints")) {
        document.getElementById("resolvedComplaints").textContent = stats.resolved || 0;
      }
    }
  } catch (error) {
    console.error('Update stats error:', error);
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
  try {
    const result = await api.getComplaints();
    
    if (!result.success) {
      console.error('Failed to load complaints');
      return;
    }

    let table = document.getElementById("adminTable")?.getElementsByTagName("tbody")[0];
    if (!table) return;
    
    const complaints = result.complaints;
    table.innerHTML = "";
    
    if (complaints.length === 0) {
      document.getElementById("adminEmptyState").style.display = "block";
      document.querySelector(".table-container").style.display = "none";
      return;
    }
    
    document.getElementById("adminEmptyState").style.display = "none";
    document.querySelector(".table-container").style.display = "block";
    
    complaints.forEach((c) => {
      let statusClass = c.status.toLowerCase().replace(' ', '-');
      let row = `<tr>
                  <td><strong>#${c._id.substr(-6)}</strong></td>
                  <td>${c.title}</td>
                  <td>${c.category}</td>
                  <td style="max-width: 300px;">${c.description}</td>
                  <td><span class="status ${statusClass}">${c.status}</span></td>
                  <td>${formatDate(c.createdAt)}</td>
                  <td>
                    ${c.status !== 'Resolved' ? 
                      `<button class="secondary" onclick="updateStatus('${c._id}', 'In Progress')">In Progress</button>
                       <button class="success" onclick="updateStatus('${c._id}', 'Resolved')">Resolve</button>` 
                      : '<span style="color: #28a745; font-weight: 600;">✓ Completed</span>'}
                  </td>
                </tr>`;
      table.innerHTML += row;
    });
    
    await updateAdminStats();
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
      await loadAdminComplaints();
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
    const result = await api.getStats();
    
    if (result.success) {
      const stats = result.stats;
      
      if (document.getElementById("adminTotalComplaints")) {
        document.getElementById("adminTotalComplaints").textContent = stats.total || 0;
      }
      if (document.getElementById("adminPendingComplaints")) {
        document.getElementById("adminPendingComplaints").textContent = stats.pending || 0;
      }
      if (document.getElementById("adminInProgressComplaints")) {
        document.getElementById("adminInProgressComplaints").textContent = stats.inProgress || 0;
      }
      if (document.getElementById("adminResolvedComplaints")) {
        document.getElementById("adminResolvedComplaints").textContent = stats.resolved || 0;
      }

      // Update category breakdown
      const categoryContainer = document.getElementById("categoryStats");
      if (categoryContainer && result.categoryBreakdown) {
        categoryContainer.innerHTML = '';
        
        const colors = ['blue', 'green', 'orange', ''];
        let colorIndex = 0;
        
        for (let category in result.categoryBreakdown) {
          let card = document.createElement('div');
          card.className = `stat-card ${colors[colorIndex % colors.length]}`;
          card.innerHTML = `
            <div class="number">${result.categoryBreakdown[category]}</div>
            <h4>${category}</h4>
          `;
          categoryContainer.appendChild(card);
          colorIndex++;
        }
      }
    }
  } catch (error) {
    console.error('Update admin stats error:', error);
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
window.onload = async function() {
  if (window.location.pathname.includes('student.html')) {
    if (await checkAuth('student')) {
      await loadComplaints();
      await updateStudentStats();
    }
  } else if (window.location.pathname.includes('admin.html')) {
    if (await checkAuth('admin')) {
      await loadAdminComplaints();
    }
  }
};
