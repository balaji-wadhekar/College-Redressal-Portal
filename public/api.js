// API Configuration
const API_BASE_URL = '/api';

// Helper to get headers with token
const getHeaders = (isJson = true) => {
  const headers = {};
  if (isJson) headers['Content-Type'] = 'application/json';
  const token = localStorage.getItem('token');
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

// API Helper Functions
const api = {
  // Authentication
  async login(payload) {
    const response = await fetch(`${API_BASE_URL}/auth/admin-login`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    return await response.json();
  },

  async requestOtp(enrollmentNumber, email) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ enrollmentNumber, email })
    });
    // This returns HTML/Render if it's the first step, but we want it to be AJAX
    // For now let's assume the backend was updated to support both or we handle the response
    return await response.json();
  },

  async verifyOtp(payload) {
    const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    return await response.json();
  },

  async logout() {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: getHeaders()
    });
    return await response.json();
  },

  async checkAuth() {
    const response = await fetch(`${API_BASE_URL}/auth/check`, {
      headers: getHeaders()
    });
    return await response.json();
  },

  // Profile
  async updateProfile(department) {
    const response = await fetch(`${API_BASE_URL}/users/profile/update`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ department })
    });
    return await response.json();
  },

  // Complaints
  async getComplaints() {
    const response = await fetch(`${API_BASE_URL}/complaints`, {
      headers: getHeaders()
    });
    return await response.json();
  },

  async getComplaint(id) {
    const response = await fetch(`${API_BASE_URL}/complaints/${id}`, {
      headers: getHeaders()
    });
    return await response.json();
  },

  async createComplaint(formData) {
    const response = await fetch(`${API_BASE_URL}/complaints`, {
      method: 'POST',
      headers: getHeaders(false), // Let browser set boundary for multipart
      body: formData
    });
    return await response.json();
  },

  async updateComplaint(id, formData) {
    const response = await fetch(`${API_BASE_URL}/complaints/${id}`, {
      method: 'PUT',
      headers: getHeaders(false),
      body: formData
    });
    return await response.json();
  },

  async updateComplaintStatus(id, status) {
    const response = await fetch(`${API_BASE_URL}/complaints/${id}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ status })
    });
    return await response.json();
  },

  async deleteComplaint(id) {
    const response = await fetch(`${API_BASE_URL}/complaints/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return await response.json();
  },

  async getStats() {
    const response = await fetch(`${API_BASE_URL}/complaints/stats/summary`, {
      headers: getHeaders()
    });
    return await response.json();
  }
};

