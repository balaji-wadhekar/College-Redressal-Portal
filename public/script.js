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

  let role = document.getElementById("loginRole").value;
  let payload = { loginType: role };

  if (role === 'student') {
    let enrollment = document.getElementById("enrollment").value.trim();
    let name = document.getElementById("name").value.trim();
    if (!enrollment || !name) {
      showAlert('alertContainer', 'Please fill in all required fields!', 'error');
      return;
    }
    payload.enrollment = enrollment;
    payload.name = name;
  } else {
    let email = document.getElementById("email").value.trim();
    let pass = document.getElementById("password").value;
    if (!email || !pass) {
      showAlert('alertContainer', 'Please fill in all required fields!', 'error');
      return;
    }
    payload.email = email;
    payload.password = pass;
  }

  try {
    const result = await api.login(payload);

    if (result.success) {
      localStorage.setItem("role", result.user.role);
      localStorage.setItem("email", result.user.email);
      localStorage.setItem("enrollment", result.user.enrollment || "N/A");
      localStorage.setItem("name", result.user.name || ""); // Save Name

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
  try {
    const result = await api.checkAuth();

    if (!result.authenticated || !result.user || (requiredRole && result.user.role !== requiredRole)) {
      window.location.href = "index.html";
      return false;
    }

    // Update localStorage with fresh data from server
    localStorage.setItem("role", result.user.role);
    localStorage.setItem("email", result.user.email);
    localStorage.setItem("enrollment", result.user.enrollment || "N/A");
    localStorage.setItem("name", result.user.name || "");
    localStorage.setItem("department", result.user.department || "");

    return true;
  } catch (error) {
    console.error('Auth check failed:', error);
    window.location.href = "index.html";
    return false;
  }
}

// ========== PROFILE UPDATE ==========
async function updateProfileForm(event) {
  event.preventDefault();
  const dept = document.getElementById("profileDept").value;
  if (!dept) {
    showAlert('profileAlert', 'Please select a valid school/department', 'error');
    return;
  }
  
  try {
    const result = await api.updateProfile(dept);
    if (result.success) {
      showAlert('profileAlert', '✅ Profile updated successfully!', 'success');
      localStorage.setItem("department", dept);
      // Synchronize dashboard dropdown
      if (document.getElementById("studentDept")) {
        document.getElementById("studentDept").value = dept;
      }
    } else {
      showAlert('profileAlert', result.error || 'Failed to update profile', 'error');
    }
  } catch (error) {
    console.error('Profile update error:', error);
    showAlert('profileAlert', 'Update failed. Try again.', 'error');
  }
}

// ========== STUDENT FUNCTIONS ==========
async function submitComplaint(event) {
  event.preventDefault();

  let title = document.getElementById("title").value.trim();
  let incidentDate = document.getElementById("incidentDate").value;
  let category = document.getElementById("category").value;
  let desc = document.getElementById("description").value.trim();

  // Personal Info
  let phone = document.getElementById("studentPhone").value.trim();
  let dept = document.getElementById("studentDept").value;
  let email = document.getElementById("studentEmail").value.trim();

  // Read-only fields (for backend safety/redundancy)
  let name = document.getElementById("studentName").value || localStorage.getItem("name");
  let enrollment = document.getElementById("studentEnrollment").value || localStorage.getItem("enrollment");

  // Document Details
  let docTitle = document.getElementById("docTitle").value.trim();
  let docFile = document.getElementById("docFile").files[0];

  // Create FormData for multipart/form-data submission (file upload)
  const formData = new FormData();

  // Grievance Fields
  formData.append('title', title);
  formData.append('incidentDate', incidentDate);
  formData.append('category', category);
  formData.append('description', desc);

  // Personal Info
  formData.append('studentName', name);
  formData.append('studentPhone', phone);
  formData.append('studentEnrollment', enrollment);
  formData.append('studentDept', dept);
  formData.append('studentEmail', email);

  // Document Details
  if (docTitle) formData.append('docTitle', docTitle);
  if (docFile) formData.append('docFile', docFile);

  try {
    const result = await api.createComplaint(formData);

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
    window.studentGrievances = complaints;
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
                  <td><strong>${c.trackingID || '#' + c._id.substr(-6)}</strong></td>
                  <td>${c.title}</td>
                  <td>${c.incidentDate ? new Date(c.incidentDate).toLocaleDateString() : 'N/A'}</td>
                  <td>${c.category}</td>
                  <td style="max-width: 300px;">${c.description}</td>
                  <td><span class="status ${statusClass}">${c.status}</span></td>
                  <td>${formatDate(c.createdAt)}</td>
                  <td>
                    <div style="display: flex; gap: 0.5rem; justify-content: center;">
                      <button style="background-color: #3b82f6; color: white; border: none; padding: 0.25rem 0.5rem; border-radius: 0.25rem; font-size: 0.875rem; cursor: pointer;" onclick="viewStudentGrievance('${c._id}')">View</button>
                      ${c.status === 'Pending' ? `<button style="background-color: #eab308; color: white; border: none; padding: 0.25rem 0.5rem; border-radius: 0.25rem; font-size: 0.875rem; cursor: pointer;" onclick="editStudentGrievance('${c._id}')">Edit</button>
                      <button style="background-color: #ef4444; color: white; border: none; padding: 0.25rem 0.5rem; border-radius: 0.25rem; font-size: 0.875rem; cursor: pointer;" onclick="deleteComplaint('${c._id}')">Delete</button>` 
                      : ''}
                    </div>
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
window.adminGrievances = [];

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
    window.adminGrievances = complaints;
    table.innerHTML = "";

    // Critical Problems Analysis
    const criticalCategories = ['Sexual Harassment', 'Ragging', 'Discrimination'];
    const criticalGrievances = complaints.filter(c => criticalCategories.includes(c.category) && c.status !== 'Resolved');
    const alertContainer = document.getElementById('criticalAlertContainer');
    
    if (alertContainer) {
      if (criticalGrievances.length > 0) {
        let alertHTML = `
          <div class="bg-red-50 border-l-4 border-red-600 p-4 mb-6 rounded-r-lg shadow-sm" style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 1rem; margin-bottom: 1.5rem; border-top-right-radius: 0.5rem; border-bottom-right-radius: 0.5rem; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);">
              <div class="flex items-center mb-2" style="display: flex; align-items: center; margin-bottom: 0.5rem;">
                  <svg class="w-6 h-6 text-red-600 mr-2" style="width: 1.5rem; height: 1.5rem; color: #dc2626; margin-right: 0.5rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                  <h3 class="text-lg font-bold text-red-800" style="font-size: 1.125rem; font-weight: 700; color: #991b1b; margin: 0;">CRITICAL ATTENTION REQUIRED</h3>
              </div>
              <p class="text-red-700 text-sm mb-3" style="color: #b91c1c; font-size: 0.875rem; margin-bottom: 0.75rem;">There are ${criticalGrievances.length} unresolved critical grievances requiring immediate action.</p>
              <ul class="space-y-2" style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.5rem;">`;

        criticalGrievances.forEach(grv => {
            alertHTML += `
                <li class="bg-white p-3 rounded border border-red-200 shadow-sm flex justify-between items-center" style="background-color: #ffffff; padding: 0.75rem; border-radius: 0.25rem; border: 1px solid #fecaca; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);">
                    <div style="display: flex; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
                        <span class="inline-block px-2 py-1 text-xs font-bold bg-red-100 text-red-700 rounded mr-2" style="display: inline-block; padding: 0.25rem 0.5rem; font-size: 0.75rem; font-weight: 700; background-color: #fee2e2; color: #b91c1c; border-radius: 0.25rem;">${grv.category}</span>
                        <span class="text-gray-800 font-medium" style="color: #1f2937; font-weight: 600;">${grv.title}</span>
                        <span class="text-gray-500 text-xs ml-2" style="color: #6b7280; font-size: 0.75rem;">ID: ${grv.trackingID || '#' + grv._id.substr(-6)} | Student: ${grv.studentName || grv.studentEmail || 'Unknown'}</span>
                    </div>
                    <div style="display: flex; gap: 0.5rem;">
                        ${grv.status !== 'In Progress' ? `<button style="background-color: #f59e0b; color: white; padding: 0.25rem 0.75rem; border-radius: 0.25rem; font-size: 0.875rem; border: none; cursor: pointer;" onclick="updateStatus('${grv._id}', 'In Progress')">In Progress</button>` : ''}
                        <button style="background-color: #16a34a; color: white; padding: 0.25rem 0.75rem; border-radius: 0.25rem; font-size: 0.875rem; border: none; cursor: pointer;" onclick="updateStatus('${grv._id}', 'Resolved')">Resolve</button>
                    </div>
                </li>`;
        });
        
        alertHTML += `</ul></div>`;
        alertContainer.innerHTML = alertHTML;
        alertContainer.style.display = 'block';
      } else {
        alertContainer.style.display = 'none';
        alertContainer.innerHTML = '';
      }
    }

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
                  <td class="align-top p-4 border-b border-gray-200"><strong>${c.trackingID || '#' + c._id.substr(-6)}</strong></td>
                  <td class="align-top p-4 border-b border-gray-200">${c.title}</td>
                  <td class="align-top p-4 border-b border-gray-200">${c.category}</td>
                  <td class="align-top p-4 border-b border-gray-200" style="max-width: 300px;">${c.description}</td>
                  <td class="align-top p-4 border-b border-gray-200"><span class="status ${statusClass}">${c.status}</span></td>
                  <td class="align-top p-4 border-b border-gray-200">${formatDate(c.createdAt)}</td>
                  <td class="align-top p-4 border-b border-gray-200">
                    <div class="flex flex-col gap-2 items-center">
                      <button class="secondary w-full" onclick="viewGrievanceDetails('${c._id}')">View Details</button>
                      ${c.status !== 'Resolved' ?
            `<button class="secondary w-full" onclick="updateStatus('${c._id}', 'In Progress')">In Progress</button>
                         <button class="success w-full" onclick="updateStatus('${c._id}', 'Resolved')">Resolve</button>`
            : '<span class="w-full text-center block" style="color: #28a745; font-weight: 600;">✓ Completed</span>'}
                    </div>
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

// ========== MODULE/MODAL LOGIC FOR STUDENTS ==========
window.viewStudentGrievance = function(id) {
  const c = window.studentGrievances.find(g => g._id === id);
  if (!c) return;

  document.getElementById("modalTitle").innerText = "Grievance Details";
  const modalContent = document.getElementById("modalContent");
  
  modalContent.innerHTML = `
    <div style="margin-bottom: 20px; font-size: 15px; line-height: 1.6;">
      <p><strong>Category:</strong> ${c.category}</p>
      <p><strong>Subject:</strong> ${c.title}</p>
      <p><strong>Summary:</strong> ${c.description}</p>
      <p><strong>Status:</strong> ${c.status}</p>
    </div>
    
    <div class="mt-6 border-t border-gray-200 pt-6" style="margin-top: 1.5rem; border-top: 1px solid #e5e7eb; padding-top: 1.5rem;">
      <h3 class="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3" style="font-size: 0.875rem; font-weight: 500; color: #6b7280; text-transform: uppercase;">Attached Proof</h3>
      ${c.docPath ? `
      <div style="display: flex; align-items: center; padding: 1rem; background-color: #eff6ff; border: 1px solid #dbeafe; border-radius: 0.5rem;">
        <span style="font-size: 1.5rem; margin-right: 0.75rem;">📄</span>
        <a href="/uploads/${c.docPath}" target="_blank" style="color: #2563eb; text-decoration: underline; font-weight: 600;">View Uploaded Document</a>
      </div>
      ` : `
      <div style="padding: 1rem; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 0.5rem; color: #6b7280; font-size: 0.875rem; font-style: italic;">
        No proof document was attached.
      </div>
      `}
    </div>
    
    ${c.status === 'Pending' ? `
    <div style="margin-top: 1.5rem; display: flex; gap: 1rem;">
      <button style="background-color: #eab308; color: white; border: none; padding: 0.5rem 1rem; border-radius: 0.25rem; cursor: pointer; font-weight: bold;" onclick="editStudentGrievance('${c._id}')">Edit Grievance</button>
      <button style="background-color: #ef4444; color: white; border: none; padding: 0.5rem 1rem; border-radius: 0.25rem; cursor: pointer; font-weight: bold;" onclick="if(confirm('Delete this grievance?')) { deleteComplaint('${c._id}'); closeModal(); }">Delete Grievance</button>
    </div>` : ''}
  `;
  document.getElementById("grievanceModal").style.display = "block";
};

window.editStudentGrievance = function(id) {
  const c = window.studentGrievances.find(g => g._id === id);
  if (!c || c.status !== 'Pending') return;

  document.getElementById("modalTitle").innerText = "Edit Grievance";
  const modalContent = document.getElementById("modalContent");
  
  modalContent.innerHTML = `
    <form id="editGrievanceForm" onsubmit="submitEditComplaint(event, '${c._id}')">
      <div style="margin-bottom: 1rem;">
        <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Title</label>
        <input type="text" id="editTitle" value="${c.title}" required style="width: 100%; padding: 0.5rem; border: 1px solid #ccc; border-radius: 0.25rem;">
      </div>
      <div style="margin-bottom: 1rem;">
        <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Category</label>
        <select id="editCategory" required style="width: 100%; padding: 0.5rem; border: 1px solid #ccc; border-radius: 0.25rem;">
            <option value="General Grievance" ${c.category==='General Grievance'?'selected':''}>General Grievance</option>
            <option value="Hostel" ${c.category==='Hostel'?'selected':''}>Hostel</option>
            <option value="Hostel Mess" ${c.category==='Hostel Mess'?'selected':''}>Hostel Mess</option>
            <option value="Sexual Harassment" ${c.category==='Sexual Harassment'?'selected':''}>Sexual Harassment</option>
            <option value="Ragging" ${c.category==='Ragging'?'selected':''}>Ragging</option>
            <option value="Admission" ${c.category==='Admission'?'selected':''}>Admission</option>
            <option value="Discrimination" ${c.category==='Discrimination'?'selected':''}>Discrimination</option>
            <option value="Faculty Related" ${c.category==='Faculty Related'?'selected':''}>Faculty Related</option>
            <option value="Computer and Network" ${c.category==='Computer and Network'?'selected':''}>Computer and Network</option>
            <option value="ERP" ${c.category==='ERP'?'selected':''}>ERP</option>
            <option value="Maintenance" ${c.category==='Maintenance'?'selected':''}>Maintenance</option>
            <option value="Student Section" ${c.category==='Student Section'?'selected':''}>Student Section</option>
            <option value="Administration and HR" ${c.category==='Administration and HR'?'selected':''}>Administration and HR</option>
            <option value="Accounts" ${c.category==='Accounts'?'selected':''}>Accounts</option>
            <option value="Other" ${c.category==='Other'?'selected':''}>Other</option>
        </select>
      </div>
      <div style="margin-bottom: 1rem;">
        <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Description</label>
        <textarea id="editDescription" required rows="4" style="width: 100%; padding: 0.5rem; border: 1px solid #ccc; border-radius: 0.25rem;">${c.description}</textarea>
      </div>
      <div style="margin-bottom: 1rem;">
        <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Update Document (Optional)</label>
        <input type="file" id="editDocFile" accept=".pdf,.doc,.docx,.jpg,.png" style="width: 100%;">
        ${c.docPath ? `<p style="font-size: 0.8rem; color: #666; margin-top: 0.25rem;">Leaves current doc if empty.</p>` : ''}
      </div>
      <div style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 1.5rem;">
        <button type="button" onclick="viewStudentGrievance('${c._id}')" class="secondary">Cancel</button>
        <button type="submit" class="success" style="background-color: #3b82f6; border: none; color: white; padding: 0.5rem 1rem; border-radius: 0.25rem; font-weight: bold; cursor: pointer;">Save Changes</button>
      </div>
    </form>
  `;
  document.getElementById("grievanceModal").style.display = "block";
};

window.submitEditComplaint = async function(event, id) {
  event.preventDefault();
  
  let title = document.getElementById("editTitle").value.trim();
  let category = document.getElementById("editCategory").value;
  let desc = document.getElementById("editDescription").value.trim();
  let docFile = document.getElementById("editDocFile").files[0];
  
  const formData = new FormData();
  formData.append('title', title);
  formData.append('category', category);
  formData.append('description', desc);
  if (docFile) formData.append('docFile', docFile);
  
  try {
    const result = await api.updateComplaint(id, formData);
    if (result.success) {
      showAlert('complaintAlert', '✅ Grievance updated successfully!', 'success');
      closeModal();
      await loadComplaints();
    } else {
      showAlert('complaintAlert', result.error || 'Failed to update', 'error');
    }
  } catch (error) {
    console.error(error);
    showAlert('complaintAlert', 'Failed to update', 'error');
  }
};

// ========== PAGE LOAD INITIALIZATION ==========
window.onload = async function () {
  if (window.location.pathname.includes('student.html')) {
    if (await checkAuth('student')) {
      // Pre-fill Personal Info
      if (document.getElementById("studentName")) document.getElementById("studentName").value = localStorage.getItem("name") || "";
      if (document.getElementById("studentEnrollment")) document.getElementById("studentEnrollment").value = localStorage.getItem("enrollment") || "";
      if (document.getElementById("profileDept")) document.getElementById("profileDept").value = localStorage.getItem("department") || "";
      if (document.getElementById("studentDept") && localStorage.getItem("department")) {
        document.getElementById("studentDept").value = localStorage.getItem("department");
      }

      await loadComplaints();
      await updateStudentStats();
    }
  } else if (window.location.pathname.includes('admin.html')) {
    if (await checkAuth('admin')) {
      await loadAdminComplaints();
    }
  }
};

window.viewGrievanceDetails = function(id) {
  const c = window.adminGrievances.find(g => g._id === id);
  if (!c) return;
  
  const modalContent = document.getElementById("modalContent");
  
  modalContent.innerHTML = `
    <div style="margin-bottom: 20px; font-size: 15px; line-height: 1.6;">
      <p><strong>Category:</strong> ${c.category}</p>
      <p><strong>Subject:</strong> ${c.title}</p>
      <p><strong>Summary:</strong> ${c.description}</p>
    </div>
    
    <!-- Attached Proof Section per user EJS requirement -->
    <div class="mt-6 border-t border-gray-200 pt-6" style="margin-top: 1.5rem; border-top: 1px solid #e5e7eb; padding-top: 1.5rem;">
      <h3 class="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3" style="font-size: 0.875rem; font-weight: 500; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.75rem;">Attached Proof</h3>
      ${c.docPath ? `
      <div class="flex items-center p-4 bg-blue-50 border border-blue-100 rounded-lg" style="display: flex; align-items: center; padding: 1rem; background-color: #eff6ff; border: 1px solid #dbeafe; border-radius: 0.5rem;">
        <svg class="w-8 h-8 text-blue-600 mr-3" style="width: 2rem; height: 2rem; color: #2563eb; margin-right: 0.75rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
        <div class="flex-1" style="flex: 1 1 0%;">
          <p class="text-sm font-medium text-gray-900" style="font-size: 0.875rem; font-weight: 500; color: #111827; margin: 0;">Student Uploaded Document</p>
          <p class="text-xs text-gray-500" style="font-size: 0.75rem; color: #6b7280; margin: 0;">Click to view or download</p>
        </div>
        <a href="/uploads/${c.docPath}" target="_blank" class="ml-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-2 px-4 rounded shadow transition" style="margin-left: auto; background-color: #2563eb; color: white; font-size: 0.875rem; font-weight: 700; padding: 0.5rem 1rem; border-radius: 0.25rem; text-decoration: none; box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05);">
          View Document
        </a>
      </div>
      ` : `
      <div class="p-4 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 text-sm italic" style="padding: 1rem; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 0.5rem; color: #6b7280; font-size: 0.875rem; font-style: italic;">
        No proof document was attached to this grievance.
      </div>
      `}
    </div>
  `;
  document.getElementById("grievanceModal").style.display = "block";
};

window.closeModal = function() {
  document.getElementById("grievanceModal").style.display = "none";
};

window.onclick = function(event) {
  let modal = document.getElementById("grievanceModal");
  if (event.target == modal) {
    modal.style.display = "none";
  }
};
